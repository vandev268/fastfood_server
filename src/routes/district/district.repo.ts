import { Injectable } from '@nestjs/common'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class DistrictRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list(query: PaginationQueryType) {
    const { page, limit } = query
    const skip = (page - 1) * limit
    const [districts, totalItems] = await Promise.all([
      this.prismaService.district.findMany({
        skip,
        take: limit
      }),
      this.prismaService.district.count()
    ])

    return {
      data: districts,
      totalItems,
      limit,
      page,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll() {
    const districts = await this.prismaService.district.findMany({})
    return {
      data: districts,
      totalItems: districts.length
    }
  }

  async findDetail(districtId: number) {
    return await this.prismaService.district.findUnique({
      where: { id: districtId },
      include: {
        wards: true
      }
    })
  }
}
