import { z } from 'zod'
import { ReviewDetailSchema, ReviewSchema } from 'src/shared/models/shared-review.model'

export const ReviewParamsScheme = z.object({
  reviewId: z.coerce.number().int().positive()
})

export const GetReviewsQuerySchema = ReviewSchema.pick({
  productId: true
}).strict()

export const GetReviewDetailQuerySchema = ReviewSchema.pick({
  productId: true,
  orderId: true
}).strict()

export const GetReviewsResSchema = z.object({
  data: z.array(ReviewDetailSchema),
  totalItems: z.number()
})

export const CreateReviewBodySchema = ReviewSchema.pick({
  productId: true,
  orderId: true,
  rating: true,
  content: true
}).strict()

export const UpdateReviewBodySchema = CreateReviewBodySchema

export type ReviewParamsType = z.infer<typeof ReviewParamsScheme>
export type GetReviewsQueryType = z.infer<typeof GetReviewsQuerySchema>
export type GetReviewDetailQueryType = z.infer<typeof GetReviewDetailQuerySchema>
export type GetReviewsResType = z.infer<typeof GetReviewsResSchema>
export type CreateReviewBodyType = z.infer<typeof CreateReviewBodySchema>
export type UpdateReviewBodyType = z.infer<typeof UpdateReviewBodySchema>
