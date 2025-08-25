import { z } from 'zod'
import { TypeRecommendation } from 'src/shared/constants/recommandation.constant'
import { ProductRecommendationSchema } from 'src/shared/models/shared-recommendation.model'

export const RecommendationQuerySchema = z.object({
  limit: z.coerce.number().int().nonnegative().default(20),
  type: z.nativeEnum(TypeRecommendation).default(TypeRecommendation.Hybrid)
})

export const GetRecommendedProductsResSchema = z.object({
  data: z.array(ProductRecommendationSchema),
  totalItems: z.number()
})

export const GetUserBehaviorInsightsResSchema = z.object({
  totalSpent: z.number(),
  totalOrders: z.number(),
  favoriteCategories: z.array(
    z.object({
      categoryId: z.number(),
      orderCount: z.number(),
      totalAmount: z.number()
    })
  ),
  avgRating: z.number().nullable(),
  totalReviews: z.number().int().nonnegative(),
  lastOrderDate: z.date().nullable(),
  avgOrderValue: z.number(),
  customerSegment: z.string(),
  satisfactionLevel: z.string()
})

export const GetUserBehaviorTrackingResSchema = z.object({
  data: z.object({
    userId: z.number().int().nonnegative(),
    action: z.string(),
    productId: z.number().int().nonnegative(),
    timestamp: z.string().datetime()
  })
})

export type RecommendationQueryType = z.infer<typeof RecommendationQuerySchema>
export type GetRecommendedProductsResType = z.infer<typeof GetRecommendedProductsResSchema>
export type GetUserBehaviorInsightsResType = z.infer<typeof GetUserBehaviorInsightsResSchema>
export type GetUserBehaviorTrackingResType = z.infer<typeof GetUserBehaviorTrackingResSchema>
