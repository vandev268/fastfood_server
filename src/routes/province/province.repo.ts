import { Injectable } from '@nestjs/common'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class ProvinceRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list(query: PaginationQueryType) {
    const { page, limit } = query
    const skip = (page - 1) * limit
    const [provinces, totalItems] = await Promise.all([
      this.prismaService.province.findMany({
        skip,
        take: limit
      }),
      this.prismaService.province.count()
    ])

    return {
      data: provinces,
      totalItems,
      limit,
      page,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll() {
    const provinces = await this.prismaService.province.findMany({})
    return {
      data: provinces,
      totalItems: provinces.length
    }
  }

  async findDetail(provinceId: number) {
    return await this.prismaService.province.findUnique({
      where: { id: provinceId },
      include: {
        districts: true
      }
    })
  }
}
