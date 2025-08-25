import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { CreateCategoryBodyType, UpdateCategoryBodyType } from './category.model'
import { Prisma } from '@prisma/client'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'

@Injectable()
export class CategoryRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list({ where, query }: { where: Prisma.CategoryWhereInput; query: PaginationQueryType }) {
    const { page, limit } = query
    const skip = limit * (page - 1)
    const [categories, totalItems] = await Promise.all([
      this.prismaService.category.findMany({
        where,
        include: {
          parentCategory: true
        },
        skip,
        take: limit,
        orderBy: {
          // createdAt: 'desc'
          name: 'asc'
        }
      }),
      this.prismaService.category.count({ where })
    ])

    return {
      data: categories,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: Prisma.CategoryWhereInput) {
    const categories = await this.prismaService.category.findMany({
      where,
      include: {
        parentCategory: true
      },
      orderBy: { name: 'asc' } // createdAt: 'desc'
    })
    return {
      data: categories,
      totalItems: categories.length
    }
  }

  async findUnique(where: Prisma.CategoryWhereUniqueInput) {
    return await this.prismaService.category.findUnique({
      where
    })
  }

  async findDetail(where: Prisma.CategoryWhereUniqueInput) {
    return await this.prismaService.category.findUnique({
      where,
      include: {
        parentCategory: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        },
        childCategories: {
          select: {
            id: true,
            name: true,
            thumbnail: true
          }
        }
      }
    })
  }

  async create(data: CreateCategoryBodyType) {
    return await this.prismaService.category.create({
      data
    })
  }

  async update({ where, data }: { where: Prisma.CategoryWhereUniqueInput; data: UpdateCategoryBodyType }) {
    return await this.prismaService.category.update({
      where,
      data
    })
  }

  async delete(where: Prisma.CategoryWhereUniqueInput) {
    if (envConfig.DELETE_MODE === DeleteMode) {
      return await this.prismaService.category.update({
        where,
        data: { deletedAt: new Date() }
      })
    }
    return await this.prismaService.category.delete({
      where
    })
  }
}
