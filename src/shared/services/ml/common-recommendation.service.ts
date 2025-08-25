import { Injectable } from '@nestjs/common'
import {
  ProductRecommendationType,
  UpsertTrackingBehaviorBodyType,
  UserBehaviorDataType
} from 'src/shared/models/shared-recommendation.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class CommonRecommendationService {
  // In-memory cache for performance optimization with tiered TTL
  private userAdventureCache = new Map<number, { score: number; timestamp: number }>()
  private trendingCache = new Map<string, { data: ProductRecommendationType[]; timestamp: number }>()
  private contentBasedCache = new Map<string, { data: ProductRecommendationType[]; timestamp: number }>()
  private collaborativeCache = new Map<string, { data: ProductRecommendationType[]; timestamp: number }>()

  // Tiered cache TTL for optimal performance
  private readonly USER_ADVENTURE_CACHE_TTL = 60 * 60 * 1000 // 1 hour - adventure score ít thay đổi
  private readonly TRENDING_CACHE_TTL = 15 * 60 * 1000 // 15 minutes - trending cần update thường xuyên
  private readonly CONTENT_CACHE_TTL = 30 * 60 * 1000 // 30 minutes - content-based khá ổn định
  private readonly COLLABORATIVE_CACHE_TTL = 45 * 60 * 1000 // 45 minutes - collaborative ổn định hơn

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
   * Collaborative Filtering: Tìm người dùng tương tự (sử dụng UserBehaviorLog đã tối ưu)
   */
  async findSimilarUsers(userId: number, limit: number = 10): Promise<number[]> {
    const similarUsers = await this.prismaService.$queryRaw<{ userId: number; similarity: number }[]>`
      WITH user_products AS (
        SELECT DISTINCT 
          ubl."userId",
          ubl."productId",
          -- Tính weight dựa trên action và count
          CASE 
            WHEN ubl.action = 'order' THEN ubl.count * 3
            WHEN ubl.action = 'cart' THEN ubl.count * 2  
            WHEN ubl.action = 'view' THEN ubl.count * 1
            ELSE ubl.count * 0.5
          END as weight
        FROM "UserBehaviorLog" ubl
        JOIN "Product" p ON p.id = ubl."productId"
        WHERE p."deletedAt" IS NULL 
          AND ubl.action IN ('view', 'cart', 'order')
      ),
      target_user AS (
        SELECT "productId", weight FROM user_products WHERE "userId" = ${userId}
      ),
      user_similarity AS (
        SELECT 
          up."userId",
          SUM(CASE WHEN tu."productId" IS NOT NULL THEN LEAST(up.weight, tu.weight) END) as common_weight,
          SUM(up.weight) as total_weight_other,
          (SELECT SUM(weight) FROM target_user) as total_weight_target
        FROM user_products up
        LEFT JOIN target_user tu ON up."productId" = tu."productId"
        WHERE up."userId" != ${userId}
        GROUP BY up."userId"
      )
      SELECT 
        "userId",
        CASE 
          WHEN (total_weight_other + total_weight_target - common_weight) = 0 THEN 0
          ELSE CAST(common_weight AS FLOAT) / (total_weight_other + total_weight_target - common_weight)
        END as similarity
      FROM user_similarity
      WHERE common_weight > 0
      ORDER BY similarity DESC
      LIMIT ${limit}
    `

    return similarUsers.map((u) => u.userId)
  }

  /**
   * Tính User Adventure Score để personalize recommendations
   * Adventure users: thích thử sản phẩm mới, ít quan tâm rating
   * Safe users: thích sản phẩm đã được chứng minh, quan tâm rating cao
   */
  async getUserAdventureScore(userId: number): Promise<number> {
    // Check cache first with longer TTL
    const cached = this.userAdventureCache.get(userId)
    if (cached && Date.now() - cached.timestamp < this.USER_ADVENTURE_CACHE_TTL) {
      return cached.score
    }

    try {
      const userProfile = await this.prismaService.$queryRaw<{ adventure_score: number }[]>`
      WITH user_behavior AS (
        SELECT 
          -- Tỷ lệ thử sản phẩm mới (trong 60 ngày)
          COUNT(CASE WHEN p."createdAt" >= NOW() - INTERVAL '60 days' THEN 1 END)::FLOAT / 
          NULLIF(COUNT(*), 0) as new_product_ratio,
          
          -- Tỷ lệ mua sản phẩm có ít reviews
          COUNT(CASE WHEN review_counts.review_count <= 5 THEN 1 END)::FLOAT / 
          NULLIF(COUNT(*), 0) as low_review_ratio,
          
          -- Diversity score: số category khác nhau đã thử
          COUNT(DISTINCT cp."A")::INTEGER / 
          (SELECT COUNT(*)::INTEGER FROM "Category" WHERE "deletedAt" IS NULL) as category_diversity,
          
          -- Risk taking: có order sản phẩm rating thấp không
          COUNT(CASE WHEN review_counts.avg_rating < 3.5 AND review_counts.review_count >= 5 THEN 1 END)::FLOAT /
          NULLIF(COUNT(*)::INTEGER, 0) as risk_taking_ratio
          
        FROM "Order" o
        JOIN "OrderItem" oi ON o.id = oi."orderId"  
        JOIN "Product" p ON p.id = oi."productId"
        LEFT JOIN "_CategoryToProduct" cp ON cp."B" = p.id
        LEFT JOIN (
          SELECT 
            "productId", 
            AVG(rating) as avg_rating, 
            COUNT(*)::INTEGER as review_count
          FROM "Review" 
          GROUP BY "productId"
        ) review_counts ON review_counts."productId" = p.id
        WHERE o."userId" = ${userId}
          AND o."deletedAt" IS NULL
          AND p."deletedAt" IS NULL
          AND o."createdAt" >= NOW() - INTERVAL '1 year'  -- Chỉ tính 1 năm gần đây
      )
      SELECT 
        -- Combine các factors thành adventure score (0-1)
        LEAST(1.0, GREATEST(0.0, 
          COALESCE(new_product_ratio, 0) * 0.3 + 
          COALESCE(low_review_ratio, 0) * 0.25 +
          COALESCE(category_diversity, 0) * 0.25 + 
          COALESCE(risk_taking_ratio, 0) * 0.2
        )) as adventure_score
      FROM user_behavior
    `

      const adventureScore = userProfile[0]?.adventure_score || 0.3 // Default: hơi conservative

      // Cache the result
      this.userAdventureCache.set(userId, {
        score: adventureScore,
        timestamp: Date.now()
      })

      return adventureScore
    } catch (error) {
      console.error('Error calculating user adventure score:', error)
      return 0.3 // Conservative fallback
    }
  }

  /**
   * Enhanced Content-Based với User Adventure Score
   */
  async getContentBasedRecommendations(userId: number, limit: number = 10): Promise<ProductRecommendationType[]> {
    // Check cache first
    const cacheKey = `content_${userId}_${limit}`
    const cached = this.contentBasedCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CONTENT_CACHE_TTL) {
      return cached.data
    }

    // Lấy user adventure score để personalize
    const userAdventureScore = await this.getUserAdventureScore(userId)

    const recommendations = await this.prismaService.$queryRaw<any[]>`
      WITH user_preferences AS (
        SELECT 
          c.id as category_id,
          c.name as category_name,
          -- Tính preference score từ UserBehaviorLog
          SUM(CASE 
            WHEN ubl.action = 'order' THEN ubl.count * 3
            WHEN ubl.action = 'cart' THEN ubl.count * 2  
            WHEN ubl.action = 'view' THEN ubl.count * 1
            ELSE ubl.count * 0.5
          END) as behavior_score,
          AVG(r.rating) as avg_rating,
          -- Time decay: behavior gần đây quan trọng hơn
          AVG(EXTRACT(EPOCH FROM (NOW() - ubl."lastSeen")) / (24 * 3600)) as days_since_last_interaction
        FROM "UserBehaviorLog" ubl
        JOIN "Product" p ON p.id = ubl."productId"
        JOIN "_CategoryToProduct" cp ON cp."B" = ubl."productId"
        JOIN "Category" c ON c.id = cp."A"
        LEFT JOIN "Review" r ON r."productId" = ubl."productId" AND r."userId" = ubl."userId"
        WHERE ubl."userId" = ${userId} 
          AND p."deletedAt" IS NULL 
          AND c."deletedAt" IS NULL
          AND ubl.action IN ('view', 'cart', 'order')
        GROUP BY c.id, c.name
      ),
      weighted_preferences AS (
        SELECT 
          category_id,
          category_name,
          -- Combine behavior score, rating, và time decay
          (behavior_score * 0.5 + 
           COALESCE(avg_rating, 3) * 0.3 + 
           EXP(-days_since_last_interaction / 30) * 0.2) as preference_score
        FROM user_preferences
      ),
      candidate_products AS (
        SELECT DISTINCT
          p.id,
          p.type,
          p.name,
          p."basePrice",
          p."shortDescription",
          p.images,
          p.status,
          p."variantsConfig",
          p."deletedAt",
          wp.preference_score,
          wp.category_name,
          AVG(r.rating) as raw_rating,
          COUNT(r.id)::INTEGER as review_count,
          -- Bayesian smoothing: (C*m + Σx)/(C + n) where C=confidence, m=global_mean
          CASE 
            WHEN COUNT(r.id) >= 10 THEN AVG(r.rating)  -- Đủ reviews: dùng average thật
            WHEN COUNT(r.id) > 0 THEN 
              -- Bayesian smoothing với global mean = 3.5
              (3.5 * 5 + SUM(r.rating)) / (5 + COUNT(r.id))
            ELSE 3.5  -- Default rating cho sản phẩm chưa có review
          END as bayesian_rating,
          -- Confidence score dựa trên số lượng reviews
          CASE 
            WHEN COUNT(r.id) >= 50 THEN 1.0      -- Rất tin cậy
            WHEN COUNT(r.id) >= 20 THEN 0.8      -- Tin cậy
            WHEN COUNT(r.id) >= 10 THEN 0.6      -- Khá tin cậy  
            WHEN COUNT(r.id) >= 5 THEN 0.4       -- Ít tin cậy
            WHEN COUNT(r.id) >= 2 THEN 0.2       -- Rất ít tin cậy
            ELSE 0.1                             -- Không tin cậy
          END as confidence_score,
          -- Novelty score (sản phẩm mới có bonus)
          CASE 
            WHEN p."createdAt" >= NOW() - INTERVAL '30 days' THEN 1.2  -- Sản phẩm mới
            WHEN p."createdAt" >= NOW() - INTERVAL '90 days' THEN 1.1  -- Khá mới
            ELSE 1.0  -- Sản phẩm cũ
          END as novelty_score
        FROM "Product" p
        JOIN "_CategoryToProduct" cp ON cp."B" = p.id
        JOIN weighted_preferences wp ON wp.category_id = cp."A"
        LEFT JOIN "Review" r ON r."productId" = p.id
        WHERE p."deletedAt" IS NULL 
          AND p.status = 'Available'
          -- Soft penalty cho sản phẩm đã mua gần đây thay vì loại bỏ hoàn toàn
        GROUP BY p.id, p.type, p.name, p."basePrice", p."shortDescription", p.images, p.status, p."variantsConfig", p."deletedAt", wp.preference_score, wp.category_name, p."createdAt"
      ),
      recent_purchases AS (
        -- Lấy sản phẩm đã mua trong 30 ngày gần đây để penalty
        SELECT DISTINCT oi."productId"
        FROM "Order" o
        JOIN "OrderItem" oi ON o.id = oi."orderId"
        WHERE o."userId" = ${userId} 
          AND o."deletedAt" IS NULL 
          AND o."createdAt" >= NOW() - INTERVAL '30 days'
      )
      SELECT 
        cp.id,
        cp.type,
        cp.name,
        cp."basePrice",
        cp."shortDescription",
        cp.images,
        cp.status,
        cp."variantsConfig",
        cp."deletedAt",
        -- Enhanced scoring với User Adventure Score personalization và penalty cho sản phẩm đã mua
        CASE 
          WHEN rp."productId" IS NOT NULL THEN 
            -- Penalty 70% cho sản phẩm đã mua gần đây
            (cp.preference_score * 0.5 + 
             cp.bayesian_rating * cp.confidence_score * ${userAdventureScore < 0.5 ? 0.4 : 0.25} + 
             LOG(cp.review_count + 1) * 0.1 + 
             cp.novelty_score * ${userAdventureScore > 0.7 ? 0.25 : 0.1}) * 0.3
          ELSE 
            -- Score bình thường cho sản phẩm chưa mua
            (cp.preference_score * 0.5 + 
             cp.bayesian_rating * cp.confidence_score * ${userAdventureScore < 0.5 ? 0.4 : 0.25} + 
             LOG(cp.review_count + 1) * 0.1 + 
             cp.novelty_score * ${userAdventureScore > 0.7 ? 0.25 : 0.1})
        END as score,
        CONCAT('Dựa trên sở thích về ', cp.category_name, 
               CASE 
                 WHEN cp.review_count >= 10 THEN ' (đánh giá tin cậy)'
                 WHEN cp.review_count >= 2 THEN ' (ít đánh giá)'
                 ELSE ' (sản phẩm mới)'
               END,
               CASE 
                 WHEN rp."productId" IS NOT NULL THEN ' (đã mua gần đây)'
                 ELSE ''
               END) as reason,
        cp.raw_rating as avg_rating,
        cp.review_count,
        cp.bayesian_rating,
        cp.confidence_score,
        cp.novelty_score
      FROM candidate_products cp
      LEFT JOIN recent_purchases rp ON rp."productId" = cp.id
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

      // Quality filtering và Cold Start handling
      let finalScore = rec.score

      // Quality filter: giảm score cho sản phẩm chất lượng kém đã được xác nhận
      if (rec.raw_rating && rec.raw_rating < 2.5 && rec.review_count >= 10) {
        finalScore *= 0.3
      }

      // Cold start boost: tăng score cho sản phẩm mới có potential
      if (rec.review_count < 3 && rec.novelty_score > 1.1) {
        finalScore *= 1.3
      }

      // Adventure user bonus cho sản phẩm mới
      if (userAdventureScore > 0.7 && rec.review_count < 5) {
        finalScore *= 1.2
      }

      results.push({
        ...rec,
        score: finalScore,
        rating: {
          avg: rec.raw_rating || null,
          quantity: rec.review_count || 0
        },
        categories
      })
    }

    // Cache the result
    this.contentBasedCache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    })

    // Re-sort sau khi apply filters
    return results.sort((a, b) => b.score - a.score)

    return results
  }

  /**
   * Collaborative Filtering: Gợi ý dựa trên người dùng tương tự
   */
  async getCollaborativeRecommendations(userId: number, limit: number = 10): Promise<ProductRecommendationType[]> {
    // Check cache first
    const cacheKey = `collaborative_${userId}_${limit}`
    const cached = this.collaborativeCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.COLLABORATIVE_CACHE_TTL) {
      return cached.data
    }

    const similarUsers = await this.findSimilarUsers(userId, 20)

    if (similarUsers.length === 0) {
      return []
    }

    // Enhanced collaborative với UserBehaviorLog integration
    const recommendations = await this.prismaService.$queryRaw<any[]>`
      WITH similar_user_behaviors AS (
        SELECT 
          ubl."productId",
          p.type,
          p.name,
          p."basePrice",
          p."shortDescription",
          p.images,
          p.status,
          p."variantsConfig",
          p."deletedAt",
          -- Tính interaction score từ UserBehaviorLog
          COUNT(DISTINCT ubl."userId")::INTEGER as interaction_users,
          SUM(CASE 
            WHEN ubl.action = 'order' THEN ubl.count * 3
            WHEN ubl.action = 'cart' THEN ubl.count * 2
            WHEN ubl.action = 'view' THEN ubl.count * 1
            ELSE ubl.count * 0.5
          END) as weighted_interactions,
          -- Time decay cho behaviors
          SUM(CASE 
            WHEN ubl."lastSeen" >= NOW() - INTERVAL '30 days' THEN 
              CASE 
                WHEN ubl.action = 'order' THEN ubl.count * 3
                WHEN ubl.action = 'cart' THEN ubl.count * 2
                WHEN ubl.action = 'view' THEN ubl.count * 1
              END * 1.0
            WHEN ubl."lastSeen" >= NOW() - INTERVAL '90 days' THEN 
              CASE 
                WHEN ubl.action = 'order' THEN ubl.count * 3
                WHEN ubl.action = 'cart' THEN ubl.count * 2
                WHEN ubl.action = 'view' THEN ubl.count * 1
              END * 0.7
            ELSE 0
          END) as recent_weighted_interactions,
          AVG(r.rating) as raw_rating,
          COUNT(DISTINCT r.id)::INTEGER as review_count
        FROM "UserBehaviorLog" ubl
        JOIN "Product" p ON p.id = ubl."productId"
        LEFT JOIN "Review" r ON r."productId" = ubl."productId"
        WHERE ubl."userId" = ANY(${similarUsers})
          AND ubl."lastSeen" >= NOW() - INTERVAL '90 days'  -- Chỉ lấy behavior 3 tháng gần đây
          AND p."deletedAt" IS NULL
          AND p.status = 'Available'
          AND ubl."productId" NOT IN (
            -- Loại bỏ sản phẩm user hiện tại đã mua gần đây
            SELECT DISTINCT oi."productId"
            FROM "Order" o
            JOIN "OrderItem" oi ON o.id = oi."orderId"
            WHERE o."userId" = ${userId} 
              AND o."deletedAt" IS NULL 
              AND o."createdAt" >= NOW() - INTERVAL '30 days'
              AND oi."productId" IS NOT NULL
          )
        GROUP BY ubl."productId", p.type, p.name, p."basePrice", p."shortDescription", p.images, p.status, p."variantsConfig", p."deletedAt"
        HAVING COUNT(DISTINCT ubl."userId") >= 2  -- Ít nhất 2 similar users phải interact
      )
      SELECT 
        "productId" as id,
        type,
        name,
        "basePrice",
        "shortDescription", 
        images,
        status,
        "variantsConfig",
        "deletedAt",
        -- Enhanced collaborative scoring với behavior integration
        (interaction_users * 0.25 +                    -- Số người interact
         recent_weighted_interactions * 0.35 +         -- Recent behavior weight
         weighted_interactions * 0.2 +                 -- Overall behavior weight
         COALESCE(raw_rating, 3.5) * 0.15 +           -- Rating quality  
         LOG(review_count + 1) * 0.05) as score,      -- Review quantity
        CONCAT('Người dùng tương tự quan tâm (', interaction_users, ' người', 
               CASE 
                 WHEN review_count >= 5 THEN ', đánh giá tốt'
                 WHEN interaction_users >= 5 THEN ', rất phổ biến'
                 ELSE ', đang nổi'
               END, ')') as reason,
        raw_rating as avg_rating,
        review_count,
        -- Bayesian rating cho collaborative
        CASE 
          WHEN review_count >= 8 THEN raw_rating
          WHEN review_count > 0 THEN 
            (3.5 * 4 + raw_rating * review_count) / (4 + review_count)
          ELSE 3.5
        END as bayesian_rating,
        -- Confidence dựa trên interaction users và reviews
        CASE 
          WHEN interaction_users >= 10 AND review_count >= 5 THEN 1.0
          WHEN interaction_users >= 5 AND review_count >= 3 THEN 0.8
          WHEN interaction_users >= 3 THEN 0.6
          ELSE 0.4
        END as confidence_score
      FROM similar_user_behaviors
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

    // Cache the collaborative filtering result
    this.collaborativeCache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    })

    return results
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
   * Hybrid Recommendations: Kết hợp Content-Based và Collaborative Filtering
   */
  async getHybridRecommendations(userId: number, limit: number = 20): Promise<ProductRecommendationType[]> {
    // Fixed weights: 70% content-based, 30% collaborative
    const hybridWeights = {
      contentBased: 0.7, // 70% content-based
      collaborative: 0.3 // 30% collaborative
    }

    const [contentBased, collaborative] = await Promise.all([
      this.getContentBasedRecommendations(userId, Math.ceil(limit * hybridWeights.contentBased)),
      this.getCollaborativeRecommendations(userId, Math.ceil(limit * hybridWeights.collaborative))
    ])

    // Gộp và loại bỏ trùng lặp
    const allRecommendations = [...contentBased, ...collaborative]
    const uniqueRecommendations = allRecommendations.reduce((acc, current) => {
      const existingIndex = acc.findIndex((item) => item.id === current.id)
      if (existingIndex !== -1) {
        // Nếu đã tồn tại, cộng điểm và cập nhật lý do
        acc[existingIndex].score = (acc[existingIndex].score + current.score) / 2
        acc[existingIndex].reason = `${acc[existingIndex].reason} & ${current.reason}`
      } else {
        acc.push(current)
      }
      return acc
    }, [] as ProductRecommendationType[])

    // Sort theo score
    const sortedRecommendations = uniqueRecommendations.sort((a, b) => b.score - a.score)

    // Natural shuffling cho đa dạng: giữ top 30% nguyên, shuffle 70% còn lại trong groups
    const finalResults = this.naturalShuffle(sortedRecommendations, limit)

    return finalResults.slice(0, limit)
  }

  /**
   * Natural shuffling để tạo thứ tự tự nhiên hơn
   */
  private naturalShuffle(recommendations: ProductRecommendationType[], limit: number): ProductRecommendationType[] {
    if (recommendations.length <= 3) return recommendations

    const topCount = Math.ceil(recommendations.length * 0.3) // Top 30% giữ nguyên
    const topItems = recommendations.slice(0, topCount)
    const remainingItems = recommendations.slice(topCount)

    // Shuffle remaining items trong groups nhỏ để maintain quality
    const shuffledRemaining = this.shuffleInGroups(remainingItems, 3)

    return [...topItems, ...shuffledRemaining]
  }

  /**
   * Shuffle trong groups để maintain chất lượng
   */
  private shuffleInGroups(items: ProductRecommendationType[], groupSize: number): ProductRecommendationType[] {
    const result: ProductRecommendationType[] = []

    for (let i = 0; i < items.length; i += groupSize) {
      const group = items.slice(i, i + groupSize)
      // Simple Fisher-Yates shuffle cho group
      for (let j = group.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1))
        ;[group[j], group[k]] = [group[k], group[j]]
      }
      result.push(...group)
    }

    return result
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

    // Clean adventure score cache
    for (const [userId, cached] of this.userAdventureCache.entries()) {
      if (now - cached.timestamp > this.USER_ADVENTURE_CACHE_TTL) {
        this.userAdventureCache.delete(userId)
      }
    }

    // Clean trending cache
    for (const [key, cached] of this.trendingCache.entries()) {
      if (now - cached.timestamp > this.TRENDING_CACHE_TTL) {
        this.trendingCache.delete(key)
      }
    }

    // Clean content-based cache
    for (const [key, cached] of this.contentBasedCache.entries()) {
      if (now - cached.timestamp > this.CONTENT_CACHE_TTL) {
        this.contentBasedCache.delete(key)
      }
    }

    // Clean collaborative cache
    for (const [key, cached] of this.collaborativeCache.entries()) {
      if (now - cached.timestamp > this.COLLABORATIVE_CACHE_TTL) {
        this.collaborativeCache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return {
      adventure_cache_size: this.userAdventureCache.size,
      trending_cache_size: this.trendingCache.size,
      content_cache_size: this.contentBasedCache.size,
      collaborative_cache_size: this.collaborativeCache.size,
      cache_ttl: {
        adventure_minutes: this.USER_ADVENTURE_CACHE_TTL / (60 * 1000),
        trending_minutes: this.TRENDING_CACHE_TTL / (60 * 1000),
        content_minutes: this.CONTENT_CACHE_TTL / (60 * 1000),
        collaborative_minutes: this.COLLABORATIVE_CACHE_TTL / (60 * 1000)
      }
    }
  }
}
