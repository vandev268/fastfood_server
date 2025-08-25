import { z } from 'zod'
import { CouponSchema } from 'src/shared/models/shared-coupon.model'

export const CouponDetailSchema = CouponSchema

export const CouponParamsSchema = z.object({
  couponId: z.coerce.number().int().positive()
})

export const GetCouponsResSchema = z.object({
  data: z.array(CouponSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllCouponsResSchema = GetCouponsResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateCouponBodySchema = CouponSchema.pick({
  code: true,
  description: true,
  discountType: true,
  discountValue: true,
  minOrderAmount: true,
  usageLimit: true,
  isActive: true,
  expiresAt: true
})
  .strict()
  .superRefine(({ discountType, discountValue }, ctx) => {
    if (discountType === 'Percent' && (discountValue < 0 || discountValue > 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discount value must be between 0 and 100 for percentage discounts.',
        path: ['discountValue']
      })
    } else if (discountType === 'Amount' && discountValue <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Discount value must be greater than 0 for amount discounts.',
        path: ['discountValue']
      })
    }
  })

export const UpdateCouponBodySchema = CreateCouponBodySchema

export const ChangeCouponStatusBodySchema = CouponSchema.pick({
  isActive: true
}).strict()

export type CouponDetailType = z.infer<typeof CouponDetailSchema>
export type CouponParamsType = z.infer<typeof CouponParamsSchema>
export type GetCouponsResType = z.infer<typeof GetCouponsResSchema>
export type GetAllCouponsResType = z.infer<typeof GetAllCouponsResSchema>
export type CreateCouponBodyType = z.infer<typeof CreateCouponBodySchema>
export type UpdateCouponBodyType = z.infer<typeof UpdateCouponBodySchema>
export type ChangeCouponStatusBodyType = z.infer<typeof ChangeCouponStatusBodySchema>
