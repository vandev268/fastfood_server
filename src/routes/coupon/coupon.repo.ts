import { Injectable } from '@nestjs/common'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ChangeCouponStatusBodyType, CreateCouponBodyType, UpdateCouponBodyType } from './coupon.model'
import { Prisma } from '@prisma/client'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'

@Injectable()
export class CouponRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list({ where, query }: { where: Prisma.CouponWhereInput; query: PaginationQueryType }) {
    const { page, limit } = query
    const skip = (page - 1) * limit
    const [coupons, totalItems] = await Promise.all([
      this.prismaService.coupon.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prismaService.coupon.count({ where })
    ])

    return {
      data: coupons,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: Prisma.CouponWhereInput) {
    const coupons = await this.prismaService.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    return {
      data: coupons,
      totalItems: coupons.length
    }
  }

  async create(data: CreateCouponBodyType) {
    return await this.prismaService.coupon.create({
      data
    })
  }

  async update({ where, data }: { where: Prisma.CouponWhereUniqueInput; data: UpdateCouponBodyType }) {
    return await this.prismaService.coupon.update({
      where,
      data
    })
  }

  async changeStatus({ where, data }: { where: Prisma.CouponWhereUniqueInput; data: ChangeCouponStatusBodyType }) {
    return await this.prismaService.coupon.update({
      where,
      data: { isActive: data.isActive }
    })
  }

  async delete(where: Prisma.CouponWhereUniqueInput) {
    if (envConfig.DELETE_MODE === DeleteMode) {
      return await this.prismaService.coupon.update({
        where,
        data: { deletedAt: new Date() }
      })
    }
    return await this.prismaService.coupon.delete({
      where
    })
  }
}
