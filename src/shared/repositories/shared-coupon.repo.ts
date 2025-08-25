import { Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class SharedCouponRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async findUnique(where: Prisma.CouponWhereUniqueInput) {
    return await this.prismaService.coupon.findUnique({
      where
    })
  }
}
