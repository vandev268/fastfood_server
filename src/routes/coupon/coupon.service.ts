import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { CouponRepo } from './coupon.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { ChangeCouponStatusBodyType, CreateCouponBodyType, UpdateCouponBodyType } from './coupon.model'
import { isUniquePrismaError } from 'src/shared/helpers'
import { SharedCouponRepo } from 'src/shared/repositories/shared-coupon.repo'

@Injectable()
export class CouponService {
  constructor(
    private readonly couponRepo: CouponRepo,
    private readonly sharedCouponRepo: SharedCouponRepo
  ) {}

  private async verifyCouponExists({ couponId }: { couponId: number }) {
    const coupon = await this.sharedCouponRepo.findUnique({ id: couponId, deletedAt: null })
    if (!coupon) {
      throw new NotFoundException('Coupon not found')
    }
    return coupon
  }

  async list(query: PaginationQueryType) {
    return await this.couponRepo.list({ where: { deletedAt: null }, query })
  }

  async findAll() {
    return await this.couponRepo.findAll({ deletedAt: null })
  }

  async findDetail(couponId: number) {
    return await this.verifyCouponExists({ couponId })
  }

  async create(data: CreateCouponBodyType) {
    try {
      const coupon = await this.couponRepo.create(data)
      return coupon
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Coupon code already exists',
          path: 'code'
        })
      }
      throw error
    }
  }

  async update({ couponId, data }: { couponId: number; data: UpdateCouponBodyType }) {
    const { id } = await this.verifyCouponExists({ couponId })
    try {
      const coupon = await this.couponRepo.update({ where: { id }, data })
      return coupon
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Coupon code already exists',
          path: 'code'
        })
      }
      throw error
    }
  }

  async changeStatus({ couponId, data }: { couponId: number; data: ChangeCouponStatusBodyType }) {
    const { id } = await this.verifyCouponExists({ couponId })
    await this.couponRepo.changeStatus({ where: { id }, data })
    return { message: 'Coupon status updated successfully' }
  }

  async delete(couponId: number) {
    const { id } = await this.verifyCouponExists({ couponId })
    await this.couponRepo.delete({ id })
    return { message: 'Coupon deleted successfully' }
  }
}
