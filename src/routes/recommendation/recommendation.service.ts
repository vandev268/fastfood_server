import { BadRequestException, Injectable } from '@nestjs/common'
import { GetUserBehaviorInsightsResType, RecommendationQueryType } from './recommendation.model'
import { UpsertTrackingBehaviorBodyType } from 'src/shared/models/shared-recommendation.model'
import { ContentBasedRecommendationService } from 'src/shared/services/ml/content-based-recommendation.service'
import { CommonRecommendationService } from 'src/shared/services/ml/common-recommendation.service'

@Injectable()
export class RecommendationService {
  private insightsCache = new Map<number, { data: any; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000

  constructor(
    private readonly commonRecommendationService: CommonRecommendationService,
    private readonly contentBasedRecommendationService: ContentBasedRecommendationService
  ) {}

  private getCustomerSegment(avgRating: number | null, totalSpent: number, totalOrders: number): string {
    if (!avgRating) return 'new_customer'

    if (avgRating >= 4.5 && totalSpent >= 1000000) return 'champion'
    if (avgRating >= 4.0 && totalOrders >= 10) return 'loyal'
    if (avgRating >= 3.5 && totalSpent >= 500000) return 'potential_loyalist'
    if (avgRating < 3.0 && totalOrders >= 5) return 'at_risk'
    if (totalOrders <= 3) return 'new_customer'
    return 'regular'
  }

  private getSatisfactionLevel(avgRating: number | null): string {
    if (!avgRating) return 'unknown'
    if (avgRating >= 4.5) return 'very_satisfied'
    if (avgRating >= 4.0) return 'satisfied'
    if (avgRating >= 3.5) return 'neutral'
    if (avgRating >= 2.5) return 'dissatisfied'
    return 'very_dissatisfied'
  }

  async getUserBehaviorInsights(userId: number): Promise<GetUserBehaviorInsightsResType> {
    const cached = this.insightsCache.get(userId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    try {
      const behaviorData = await this.commonRecommendationService.getUserBehaviorData(userId)
      const userRatings = await this.commonRecommendationService.getUserRatings(userId)
      const totalSpent = behaviorData.reduce((sum, item) => sum + Number(item.totalAmount), 0)
      const totalOrders = behaviorData.reduce((sum, item) => sum + item.orderCount, 0)
      const favoriteCategories = behaviorData
        .reduce(
          (acc, item) => {
            if (!item.categoryId) return acc

            const existing = acc.find((cat) => cat.categoryId === item.categoryId)
            if (existing) {
              existing.orderCount += item.orderCount
              existing.totalAmount += Number(item.totalAmount)
            } else {
              acc.push({
                categoryId: item.categoryId,
                orderCount: item.orderCount,
                totalAmount: Number(item.totalAmount)
              })
            }
            return acc
          },
          [] as Array<{ categoryId: number; orderCount: number; totalAmount: number }>
        )
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 5)

      // Calculate accurate user satisfaction from direct ratings
      const avgRating =
        userRatings.length > 0 ? userRatings.reduce((sum, rating) => sum + rating, 0) / userRatings.length : null

      // Get last order date
      const lastOrderDate =
        behaviorData.length > 0 ? Math.max(...behaviorData.map((item) => new Date(item.lastOrderDate).getTime())) : null

      // Calculate additional insights
      const insights = {
        totalSpent: Math.round(totalSpent * 100) / 100, // Round to 2 decimal places
        totalOrders,
        favoriteCategories,
        avgRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        totalReviews: userRatings.length,
        lastOrderDate,
        // Additional analytics
        avgOrderValue: totalOrders > 0 ? Math.round((totalSpent / totalOrders) * 100) / 100 : 0,
        customerSegment: this.getCustomerSegment(avgRating, totalSpent, totalOrders),
        satisfactionLevel: this.getSatisfactionLevel(avgRating)
      }

      // Cache the result
      this.insightsCache.set(userId, {
        data: insights,
        timestamp: Date.now()
      })

      return insights as GetUserBehaviorInsightsResType
    } catch {
      throw new BadRequestException('Get user insights failed')
    }
  }

  async trackingUserBehavior(userId: number, data: UpsertTrackingBehaviorBodyType) {
    try {
      this.insightsCache.delete(userId)
      return await this.commonRecommendationService.updateUserBehavior({ userId, payload: data })
    } catch {
      throw new BadRequestException('Tracking user behavior failed')
    }
  }

  async getRecommendedProducts(userId: number, query: RecommendationQueryType) {
    try {
      const limit = Math.min(query.limit || 10, 50) // Limit max to 50
      const product = await this.contentBasedRecommendationService.getContentBasedRecommendations(userId, limit)
      return {
        data: product,
        totalItems: product.length
      }
    } catch {
      throw new BadRequestException('Get recommended products failed')
    }
  }

  async getTrendingProducts(query: RecommendationQueryType) {
    try {
      const limit = Math.min(query.limit || 10, 50) // Limit max to 50
      const product = await this.commonRecommendationService.getTrendingRecommendations(limit)
      return {
        data: product,
        totalItems: product.length
      }
    } catch {
      throw new BadRequestException('Get recommended products failed')
    }
  }

  async getMostViewedProducts(query: RecommendationQueryType) {
    const limit = Math.min(query.limit || 10, 50) // Limit max to 50
    try {
      return await this.commonRecommendationService.getMostViewedRecommendations(limit)
    } catch {
      throw new BadRequestException('Get most viewed products failed')
    }
  }

  async getSimilarProducts({ productId, query }: { productId: number; query: RecommendationQueryType }) {
    try {
      const limit = Math.min(query.limit || 10, 20) // Limit max to 20
      return await this.commonRecommendationService.getSimilarProductRecommendations(productId, limit)
    } catch {
      throw new BadRequestException('Get similar products failed')
    }
  }
}
