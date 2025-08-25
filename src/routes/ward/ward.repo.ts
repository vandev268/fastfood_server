import { Injectable } from '@nestjs/common'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class WardRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list(query: PaginationQueryType) {
    const { page, limit } = query
    const skip = (page - 1) * limit
    const [wards, totalItems] = await Promise.all([
      this.prismaService.ward.findMany({
        skip,
        take: limit
      }),
      this.prismaService.ward.count()
    ])

    return {
      data: wards,
      totalItems,
      limit,
      page,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll() {
    const wards = await this.prismaService.ward.findMany()
    return {
      data: wards,
      totalItems: wards.length
    }
  }

  async findDetail(wardId: number) {
    return await this.prismaService.ward.findUnique({
      where: { id: wardId }
    })
  }
}
