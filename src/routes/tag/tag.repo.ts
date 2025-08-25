import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { CreateTagBodyType, UpdateTagBodyType } from './tag.model'
import { Prisma } from '@prisma/client'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'

@Injectable()
export class TagRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list({ where, query }: { where: Prisma.TagWhereInput; query: PaginationQueryType }) {
    const { limit, page } = query
    const skip = limit * (page - 1)
    const [tags, totalItems] = await Promise.all([
      this.prismaService.tag.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prismaService.tag.count({ where })
    ])

    return {
      data: tags,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: Prisma.TagWhereInput) {
    const tags = await this.prismaService.tag.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    return {
      data: tags,
      totalItems: tags.length
    }
  }

  async findUnique(where: Prisma.TagWhereUniqueInput) {
    return await this.prismaService.tag.findUnique({
      where
    })
  }

  async create(data: CreateTagBodyType) {
    return await this.prismaService.tag.create({ data })
  }

  async update({ where, data }: { where: Prisma.TagWhereUniqueInput; data: UpdateTagBodyType }) {
    return await this.prismaService.tag.update({
      where,
      data
    })
  }

  async delete(where: Prisma.TagWhereUniqueInput) {
    if (envConfig.DELETE_MODE === DeleteMode) {
      return await this.prismaService.tag.update({
        where,
        data: { deletedAt: new Date() }
      })
    }
    return await this.prismaService.tag.delete({
      where
    })
  }
}
