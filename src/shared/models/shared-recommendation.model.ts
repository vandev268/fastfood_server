import { z } from 'zod'
import { ProductSchema } from './shared-product.model'
import { CategorySchema } from './shared-category.model'
import { TrackingBehaviorAction } from '../constants/recommandation.constant'

export const UserBehaviorDataSchema = z.object({
  userId: z.number().int().nonnegative(),
  productId: z.number().int().nonnegative(),
  categoryId: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5).optional(),
  orderCount: z.number().int().nonnegative(),
  totalAmount: z.number().nonnegative(),
  lastOrderDate: z.date(),
  avgRating: z.number().min(0).max(5)
})

export const ProductRecommendationSchema = ProductSchema.pick({
  id: true,
  name: true,
  basePrice: true,
  images: true,
  status: true,
  variantsConfig: true,
  type: true,
  shortDescription: true,
  deletedAt: true
}).extend({
  score: z.number(),
  reason: z.string(),
  rating: z.object({
    avg: z.number().min(0).max(5).nullable().default(null),
    quantity: z.number().int().nonnegative().default(0)
  }),
  categories: z.array(
    CategorySchema.pick({
      id: true,
      name: true
    })
  )
})

export const UpsertTrackingBehaviorBodySchema = z.object({
  productId: z.number(),
  action: z.nativeEnum(TrackingBehaviorAction),
  data: z.record(z.any()).optional()
})

export type UserBehaviorDataType = z.infer<typeof UserBehaviorDataSchema>
export type ProductRecommendationType = z.infer<typeof ProductRecommendationSchema>
export type UpsertTrackingBehaviorBodyType = z.infer<typeof UpsertTrackingBehaviorBodySchema>
