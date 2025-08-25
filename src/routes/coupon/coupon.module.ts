import { Module } from '@nestjs/common'
import { CouponController } from './coupon.controller'
import { CouponService } from './coupon.service'
import { CouponRepo } from './coupon.repo'

@Module({
  controllers: [CouponController],
  providers: [CouponService, CouponRepo]
})
export class CouponModule {}
