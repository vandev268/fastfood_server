import { Injectable } from '@nestjs/common'
import {
  ProductRecommendationType,
  UpsertTrackingBehaviorBodyType,
  UserBehaviorDataType
} from 'src/shared/models/shared-recommendation.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class CommonRecommendationService {
  // In-memory cache for performance optimization
  private trendingCache = new Map<string, { data: ProductRecommendationType[]; timestamp: number }>()

  // Cache TTL for optimal performance
  private readonly TRENDING_CACHE_TTL = 15 * 60 * 1000 // 15 minutes - trending cần update thường xuyên

  constructor(private prismaService: PrismaService) {}

  /**
   * Thu thập dữ liệu hành vi người dùng từ UserBehaviorLog (đã tối ưu storage)
   */
  async getUserBehaviorData(userId: number): Promise<UserBehaviorDataType[]> {
    const userBehavior = await this.prismaService.$queryRaw<UserBehaviorDataType[]>`
      SELECT 
        ubl."userId",
        ubl."productId",
        pc."categoryId",
        AVG(r.rating) as "avgRating",
        -- Sử dụng count từ UserBehaviorLog thay vì đếm orders
        SUM(CASE WHEN ubl.action = 'order' THEN ubl.count ELSE 0 END)::INTEGER as "orderCount",
        -- Estimate totalAmount dựa trên product basePrice và order count
        SUM(CASE WHEN ubl.action = 'order' THEN ubl.count * p."basePrice" ELSE 0 END)::NUMERIC as "totalAmount",
        MAX(ubl."lastSeen") as "lastOrderDate"
      FROM "UserBehaviorLog" ubl
      JOIN "Product" p ON p.id = ubl."productId"
      LEFT JOIN "Review" r ON r."productId" = ubl."productId" AND r."userId" = ubl."userId"
      LEFT JOIN "_CategoryToProduct" pc ON pc."B" = ubl."productId"
      WHERE ubl."userId" = ${userId} 
        AND p."deletedAt" IS NULL
        AND ubl.action IN ('view', 'cart', 'order')
      GROUP BY ubl."userId", ubl."productId", pc."categoryId"
      ORDER BY "totalAmount" DESC, "orderCount" DESC
    `

    return userBehavior
  }

  /**
   * Get user's direct ratings for accurate satisfaction analysis
   */
  async getUserRatings(userId: number): Promise<number[]> {
    const ratings = await this.prismaService.review.findMany({
      where: { userId },
      select: { rating: true }
    })

    return ratings.map((r) => r.rating)
  }

  /**
   * Trending Products: Sản phẩm đang thịnh hành (fallback strategy nếu UserBehaviorLog chưa có data)
   */
  async getTrendingRecommendations(limit: number = 10): Promise<ProductRecommendationType[]> {
    // Check cache first
    const cacheKey = `trending_${limit}`
    const cached = this.trendingCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.TRENDING_CACHE_TTL) {
      return cached.data
    }

    try {
      // Thử với approach mới: Focus trên actual orders + rating theo thứ tự ưu tiên
      const behaviorBasedTrending = await this.prismaService.$queryRaw<any[]>`
      WITH order_stats AS (
        -- Tính actual order count từ UserBehaviorLog
        SELECT 
          p.id,
          p.type,
          p.name,
          p."basePrice", 
          p."shortDescription",
          p.images,
          p.status,
          p."variantsConfig",
          p."deletedAt",
          -- Pure order count với time decay
          SUM(
            CASE 
              WHEN ubl."lastSeen" >= NOW() - INTERVAL '7 days' AND ubl.action = 'order' THEN ubl.count * 2.0
              WHEN ubl."lastSeen" >= NOW() - INTERVAL '14 days' AND ubl.action = 'order' THEN ubl.count * 1.5  
              WHEN ubl."lastSeen" >= NOW() - INTERVAL '30 days' AND ubl.action = 'order' THEN ubl.count * 1.0
              ELSE 0
            END
          ) as weighted_order_count,
          -- Simple order count
          SUM(CASE WHEN ubl.action = 'order' THEN ubl.count ELSE 0 END)::INTEGER as total_order_count,
          COUNT(DISTINCT CASE WHEN ubl.action = 'order' THEN ubl."userId" END)::INTEGER as unique_order_users
        FROM "Product" p
        JOIN "UserBehaviorLog" ubl ON ubl."productId" = p.id
        WHERE ubl."lastSeen" >= NOW() - INTERVAL '30 days'
          AND p."deletedAt" IS NULL
          AND p.status = 'Available'
        GROUP BY p.id, p.type, p.name, p."basePrice", p."shortDescription", p.images, p.status, p."variantsConfig", p."deletedAt"
        HAVING SUM(CASE WHEN ubl.action = 'order' THEN ubl.count ELSE 0 END) > 0
      ),
      trending_products AS (
        SELECT 
          os.*,
          AVG(r.rating) as raw_rating,
          COUNT(DISTINCT r.id)::INTEGER as review_count,
          -- Bayesian rating
          CASE 
            WHEN COUNT(DISTINCT r.id) >= 8 THEN AVG(r.rating)
            WHEN COUNT(DISTINCT r.id) > 0 THEN 
              (3.5 * 4 + SUM(r.rating)) / (4 + COUNT(DISTINCT r.id))
            ELSE 3.5
          END as bayesian_rating,
          -- Review quality confidence
          CASE 
            WHEN COUNT(DISTINCT r.id) >= 20 THEN 1.0
            WHEN COUNT(DISTINCT r.id) >= 10 THEN 0.8
            WHEN COUNT(DISTINCT r.id) >= 5 THEN 0.6
            WHEN COUNT(DISTINCT r.id) >= 2 THEN 0.4
            ELSE 0.1
          END as review_confidence,
          -- Combined priority scoring
          CASE 
            -- Priority 1: Nhiều orders + rating cao + nhiều reviews (perfect combo)
            WHEN AVG(r.rating) >= 4.0 AND COUNT(DISTINCT r.id) >= 10 THEN 
              os.weighted_order_count * 1.5 + AVG(r.rating) * COUNT(DISTINCT r.id) * 0.3
            -- Priority 2: Chỉ nhiều orders (không có rating requirements)
            WHEN COUNT(DISTINCT r.id) < 5 OR AVG(r.rating) < 4.0 THEN 
              os.weighted_order_count * 1.0
            -- Priority 3: Rating cao + nhiều reviews (ít orders)
            ELSE 
              AVG(r.rating) * COUNT(DISTINCT r.id) * 0.4 + os.weighted_order_count * 0.5
          END as priority_score
        FROM order_stats os
        LEFT JOIN "Review" r ON r."productId" = os.id
        GROUP BY os.id, os.type, os.name, os."basePrice", os."shortDescription", os.images, os.status, os."variantsConfig", os."deletedAt", os.weighted_order_count, os.total_order_count, os.unique_order_users
      )
      SELECT 
        id,
        type,
        name,
        "basePrice",
        "shortDescription",
        images,
        status,
        "variantsConfig",
        "deletedAt",
        priority_score as score,
        CONCAT('Trending: ', total_order_count, ' orders',
               CASE 
                 WHEN raw_rating >= 4.0 AND review_count >= 10 THEN ' (Best: High orders + Great rating)'
                 WHEN total_order_count >= 20 THEN ' (Popular: Many orders)'
                 WHEN raw_rating >= 4.0 AND review_count >= 5 THEN ' (Quality: High rating)'
                 ELSE ' (Rising)'
               END) as reason,
        raw_rating as avg_rating,
        review_count,
        bayesian_rating,
        review_confidence as quality_confidence,
        total_order_count,
        weighted_order_count
      FROM trending_products
      WHERE priority_score > 0
      ORDER BY priority_score DESC
      LIMIT ${limit}
    `

      // Nếu UserBehaviorLog chưa có data, fallback sang order-based trending
      if (behaviorBasedTrending.length === 0) {
        console.log('UserBehaviorLog empty, falling back to order-based trending')
        const orderBasedTrending = await this.prismaService.$queryRaw<any[]>`
        WITH order_priority AS (
          SELECT 
            p.id,
            p.type,
            p.name,
            p."basePrice", 
            p."shortDescription",
            p.images,
            p.status,
            p."variantsConfig",
            p."deletedAt",
            COUNT(DISTINCT o.id)::INTEGER as recent_orders,
            SUM(oi.quantity)::INTEGER as total_quantity,
            COUNT(DISTINCT o."userId")::INTEGER as unique_users,
            AVG(r.rating) as raw_rating,
            COUNT(DISTINCT r.id)::INTEGER as review_count,
            -- Priority scoring theo yêu cầu
            CASE 
              -- Priority 1: Nhiều orders + rating cao + nhiều reviews
              WHEN AVG(r.rating) >= 4.0 AND COUNT(DISTINCT r.id) >= 10 THEN 
                COUNT(DISTINCT o.id) * 2.0 + AVG(r.rating) * COUNT(DISTINCT r.id) * 0.2
              -- Priority 2: Chỉ nhiều orders
              WHEN COUNT(DISTINCT r.id) < 5 OR AVG(r.rating) < 4.0 THEN 
                COUNT(DISTINCT o.id) * 1.0
              -- Priority 3: Rating cao + nhiều reviews
              ELSE 
                AVG(r.rating) * COUNT(DISTINCT r.id) * 0.3 + COUNT(DISTINCT o.id) * 0.5
            END as priority_score
          FROM "Product" p
          JOIN "OrderItem" oi ON oi."productId" = p.id
          JOIN "Order" o ON o.id = oi."orderId"
          LEFT JOIN "Review" r ON r."productId" = p.id
          WHERE o."createdAt" >= NOW() - INTERVAL '30 days'
            AND o."deletedAt" IS NULL
            AND p."deletedAt" IS NULL
            AND p.status = 'Available'
          GROUP BY p.id, p.type, p.name, p."basePrice", p."shortDescription", p.images, p.status, p."variantsConfig", p."deletedAt"
        )
        SELECT 
          id,
          type,
          name,
          "basePrice",
          "shortDescription",
          images,
          status,
          "variantsConfig",
          "deletedAt",
          priority_score as score,
          CONCAT('Popular: ', recent_orders, ' orders',
                 CASE 
                   WHEN raw_rating >= 4.0 AND review_count >= 10 THEN ' + Great rating'
                   WHEN recent_orders >= 10 THEN ' (High demand)'
                   WHEN raw_rating >= 4.0 AND review_count >= 5 THEN ' + Good rating'
                   ELSE ''
                 END) as reason,
          raw_rating,
          review_count
        FROM order_priority
        WHERE priority_score > 0
        ORDER BY priority_score DESC
        LIMIT ${limit}
      `

        // Nếu vẫn không có data từ orders, trả về sản phẩm có rating cao nhất
        if (orderBasedTrending.length === 0) {
          console.log('No order data, falling back to highest rated products')
          const highestRatedProducts = await this.prismaService.$queryRaw<any[]>`
          SELECT 
            p.id,
            p.type,
            p.name,
            p."basePrice",
            p."shortDescription",
            p.images,
            p.status,
            p."variantsConfig",
            p."deletedAt",
            COALESCE(AVG(r.rating), 3) as score,
            CONCAT('Sản phẩm được đánh giá cao (', COALESCE(COUNT(r.id)::INTEGER, 0), ' đánh giá)') as reason,
            AVG(r.rating) as raw_rating,
            COUNT(r.id)::INTEGER as review_count
          FROM "Product" p
          LEFT JOIN "Review" r ON r."productId" = p.id
          WHERE p."deletedAt" IS NULL
            AND p.status = 'Available'
          GROUP BY p.id, p.type, p.name, p."basePrice", p."shortDescription", p.images, p.status, p."variantsConfig", p."deletedAt"
          ORDER BY score DESC, p."createdAt" DESC
          LIMIT ${limit}
        `

          const results: ProductRecommendationType[] = []
          for (const rec of highestRatedProducts) {
            const categories = await this.prismaService.category.findMany({
              where: {
                products: { some: { id: rec.id } },
                deletedAt: null
              },
              select: { id: true, name: true }
            })

            results.push({
              ...rec,
              rating: {
                avg: rec.raw_rating || null,
                quantity: rec.review_count || 0
              },
              categories
            })
          }
          return results
        }

        const results: ProductRecommendationType[] = []
        for (const rec of orderBasedTrending) {
          const categories = await this.prismaService.category.findMany({
            where: {
              products: { some: { id: rec.id } },
              deletedAt: null
            },
            select: { id: true, name: true }
          })

          results.push({
            ...rec,
            rating: {
              avg: rec.raw_rating || null,
              quantity: rec.review_count || 0
            },
            categories
          })
        }
        return results
      }

      const results: ProductRecommendationType[] = []
      for (const rec of behaviorBasedTrending) {
        const categories = await this.prismaService.category.findMany({
          where: {
            products: { some: { id: rec.id } },
            deletedAt: null
          },
          select: { id: true, name: true }
        })

        results.push({
          ...rec,
          rating: {
            avg: rec.raw_rating || null,
            quantity: rec.review_count || 0
          },
          categories
        })
      }

      // Cache the result
      this.trendingCache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      })

      return results
    } catch (error) {
      console.error('Error getting trending recommendations:', error)
      return []
    }
  }

  /**
   * Cập nhật dữ liệu training khi có hành vi mới
   * Sử dụng Aggregation Strategy để tránh data duplication
   */
  async updateUserBehavior({ userId, payload }: { userId: number; payload: UpsertTrackingBehaviorBodyType }) {
    const { productId, action, data } = payload
    // Lưu log hành vi với aggregation strategy để tránh duplicate
    try {
      // Thử update existing record trước (tăng count + update updatedAt)
      const updated = await this.prismaService.userBehaviorLog.updateMany({
        where: {
          userId,
          productId,
          action
        },
        data: {
          count: { increment: 1 },
          data: data || null
        }
      })

      // Nếu không có record nào được update, tạo mới
      if (updated.count === 0) {
        await this.prismaService.userBehaviorLog.create({
          data: {
            userId,
            productId,
            action,
            data: data || null,
            count: 1
          }
        })
      }
    } catch (error) {
      console.log('Error tracking user behavior:', error)
    }
  }

  /**
   * Similar Products: Gợi ý sản phẩm tương tự dựa trên category và tags của sản phẩm hiện tại
   */
  async getSimilarProductRecommendations(productId: number, limit: number = 10): Promise<ProductRecommendationType[]> {
    const recommendations = await this.prismaService.$queryRaw<any[]>`
      WITH current_product AS (
        SELECT 
          array_agg(DISTINCT c.id) as category_ids,
          array_agg(DISTINCT t.id) as tag_ids
        FROM "Product" p
        LEFT JOIN "_CategoryToProduct" cp ON cp."B" = p.id
        LEFT JOIN "Category" c ON c.id = cp."A" AND c."deletedAt" IS NULL
        LEFT JOIN "_ProductToTag" pt ON pt."A" = p.id
        LEFT JOIN "Tag" t ON t.id = pt."B" AND t."deletedAt" IS NULL
        WHERE p.id = ${productId} AND p."deletedAt" IS NULL
      ),
      similar_products AS (
        SELECT 
          p.id,
          p.type,
          p.name,
          p."basePrice",
          p."shortDescription",
          p.images,
          p.status,
          p."variantsConfig",
          p."deletedAt",
          COUNT(DISTINCT CASE WHEN c.id = ANY((SELECT unnest(category_ids) FROM current_product)) THEN c.id END)::INTEGER as category_match_count,
          COUNT(DISTINCT CASE WHEN t.id = ANY((SELECT unnest(tag_ids) FROM current_product)) THEN t.id END)::INTEGER as tag_match_count,
          AVG(r.rating) as raw_rating,
          COUNT(DISTINCT r.id)::INTEGER as review_count,
          COUNT(DISTINCT oi.id)::INTEGER as order_count
        FROM "Product" p
        LEFT JOIN "_CategoryToProduct" cp ON cp."B" = p.id
        LEFT JOIN "Category" c ON c.id = cp."A" AND c."deletedAt" IS NULL
        LEFT JOIN "_ProductToTag" pt ON pt."A" = p.id
        LEFT JOIN "Tag" t ON t.id = pt."B" AND t."deletedAt" IS NULL
        LEFT JOIN "Review" r ON r."productId" = p.id
        LEFT JOIN "OrderItem" oi ON oi."productId" = p.id
        CROSS JOIN current_product
        WHERE p.id != ${productId}
          AND p."deletedAt" IS NULL
          AND p.status = 'Available'
        GROUP BY p.id, p.type, p.name, p."basePrice", p."shortDescription", p.images, p.status, p."variantsConfig", p."deletedAt"
        HAVING COUNT(DISTINCT CASE WHEN c.id = ANY((SELECT unnest(category_ids) FROM current_product)) THEN c.id END) > 0 
           OR COUNT(DISTINCT CASE WHEN t.id = ANY((SELECT unnest(tag_ids) FROM current_product)) THEN t.id END) > 0
      )
      SELECT 
        id,
        type,
        name,
        "basePrice",
        "shortDescription",
        images,
        status,
        "variantsConfig",
        "deletedAt",
        (category_match_count * 0.6 + tag_match_count * 0.2 + COALESCE(raw_rating, 3) * 0.1 + LOG(order_count + 1) * 0.1) as score,
        CASE 
          WHEN category_match_count > 0 AND tag_match_count > 0 THEN 'Cùng danh mục và đặc điểm tương tự'
          WHEN category_match_count > 0 THEN 'Cùng danh mục'
          ELSE 'Đặc điểm tương tự'
        END as reason,
        raw_rating,
        review_count
      FROM similar_products
      ORDER BY score DESC
      LIMIT ${limit}
    `

    const results: ProductRecommendationType[] = []
    for (const rec of recommendations) {
      const categories = await this.prismaService.category.findMany({
        where: {
          products: { some: { id: rec.id } },
          deletedAt: null
        },
        select: { id: true, name: true }
      })

      results.push({
        ...rec,
        rating: {
          avg: rec.raw_rating || null,
          quantity: rec.review_count || 0
        },
        categories
      })
    }

    return results
  }

  /**
   * Most Viewed Products: Sản phẩm được quan tâm nhiều nhất dựa trên lượt view
   */
  async getMostViewedRecommendations(limit: number = 10): Promise<ProductRecommendationType[]> {
    const recommendations = await this.prismaService.$queryRaw<any[]>`
      WITH most_viewed_products AS (
        SELECT 
          p.id,
          p.type,
          p.name,
          p."basePrice", 
          p."shortDescription",
          p.images,
          p.status,
          p."variantsConfig",
          p."deletedAt",
          -- Tính tổng view count với time decay
          SUM(
            CASE 
              WHEN ubl."lastSeen" >= NOW() - INTERVAL '7 days' THEN ubl.count * 2.0   -- Views tuần này: x2
              WHEN ubl."lastSeen" >= NOW() - INTERVAL '30 days' THEN ubl.count * 1.5  -- Views tháng này: x1.5
              WHEN ubl."lastSeen" >= NOW() - INTERVAL '90 days' THEN ubl.count * 1.0  -- Views 3 tháng: x1
              ELSE ubl.count * 0.5  -- Views cũ hơn: x0.5
            END
          ) as total_view_score,
          COUNT(DISTINCT ubl."userId")::INTEGER as unique_viewers,
          AVG(r.rating) as raw_rating,
          COUNT(DISTINCT r.id)::INTEGER as review_count,
          -- Recent views trong 7 ngày
          SUM(CASE WHEN ubl."lastSeen" >= NOW() - INTERVAL '7 days' THEN ubl.count ELSE 0 END)::INTEGER as recent_views
        FROM "Product" p
        JOIN "UserBehaviorLog" ubl ON ubl."productId" = p.id
        LEFT JOIN "Review" r ON r."productId" = p.id
        WHERE ubl.action = 'view'  -- Chỉ lấy view actions
          AND ubl."lastSeen" >= NOW() - INTERVAL '90 days'  -- Chỉ tính 3 tháng gần đây
          AND p."deletedAt" IS NULL
          AND p.status = 'Available'
        GROUP BY p.id, p.type, p.name, p."basePrice", p."shortDescription", p.images, p.status, p."variantsConfig", p."deletedAt"
      )
      SELECT 
        id,
        type,
        name,
        "basePrice",
        "shortDescription",
        images,
        status,
        "variantsConfig",
        "deletedAt",
        -- Scoring formula: view score + diversity + quality
        (total_view_score * 0.6 + unique_viewers * 0.25 + COALESCE(raw_rating, 3) * 0.15) as score,
        CONCAT('Được quan tâm nhất (', unique_viewers, ' người xem, ', recent_views, ' lượt gần đây)') as reason,
        raw_rating,
        review_count
      FROM most_viewed_products
      WHERE total_view_score > 0
      ORDER BY score DESC
      LIMIT ${limit}
    `

    const results: ProductRecommendationType[] = []
    for (const rec of recommendations) {
      const categories = await this.prismaService.category.findMany({
        where: {
          products: { some: { id: rec.id } },
          deletedAt: null
        },
        select: { id: true, name: true }
      })

      results.push({
        ...rec,
        rating: {
          avg: rec.raw_rating || null,
          quantity: rec.review_count || 0
        },
        categories
      })
    }

    return results
  }

  /**
   * Cache cleanup method - should be called periodically
   */
  private cleanupCache() {
    const now = Date.now()

    // Clean trending cache
    for (const [key, cached] of this.trendingCache.entries()) {
      if (now - cached.timestamp > this.TRENDING_CACHE_TTL) {
        this.trendingCache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      trending_cache_size: this.trendingCache.size,
      cache_ttl: {
        trending_minutes: this.TRENDING_CACHE_TTL / (60 * 1000)
      }
    }
  }
}
