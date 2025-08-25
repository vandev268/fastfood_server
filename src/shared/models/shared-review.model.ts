import { z } from 'zod'
import { UserSchema } from './shared-user.model'

export const ReviewSchema = z.object({
  id: z.number(),
  userId: z.number(),
  productId: z.coerce.number(),
  orderId: z.coerce.number(),
  rating: z.coerce.number().min(0).max(5),
  content: z.string().default(''),
  isEdited: z.boolean().default(false),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const ReviewDetailSchema = ReviewSchema.extend({
  user: UserSchema.pick({
    id: true,
    name: true,
    email: true,
    avatar: true
  })
})

export type ReviewType = z.infer<typeof ReviewSchema>
export type ReviewDetailType = z.infer<typeof ReviewDetailSchema>
