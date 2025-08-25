import { createZodDto } from 'nestjs-zod'
import {
  ChangeCouponStatusBodySchema,
  CouponDetailSchema,
  CouponParamsSchema,
  CreateCouponBodySchema,
  GetAllCouponsResSchema,
  GetCouponsResSchema,
  UpdateCouponBodySchema
} from './coupon.model'
import { CouponSchema } from 'src/shared/models/shared-coupon.model'

export class CouponResDTO extends createZodDto(CouponSchema) {}
export class CouponDetailResDTO extends createZodDto(CouponDetailSchema) {}
export class CouponParamsDTO extends createZodDto(CouponParamsSchema) {}
export class GetCouponsResDTO extends createZodDto(GetCouponsResSchema) {}
export class GetAllCouponsResDTO extends createZodDto(GetAllCouponsResSchema) {}
export class CreateCouponBodyDTO extends createZodDto(CreateCouponBodySchema) {}
export class UpdateCouponBodyDTO extends createZodDto(UpdateCouponBodySchema) {}
export class ChangeCouponStatusBodyDTO extends createZodDto(ChangeCouponStatusBodySchema) {}
