import { z } from 'zod'
import { CouponDiscountType } from '../constants/coupon.constant'

export const CouponSchema = z.object({
  id: z.number(),
  code: z.string().min(1).max(500),
  description: z.string().default(''),
  discountType: z.nativeEnum(CouponDiscountType),
  discountValue: z.number().positive(),
  minOrderAmount: z.number().nonnegative().default(0),
  usageLimit: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
  expiresAt: z.coerce.date().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CouponType = z.infer<typeof CouponSchema>
