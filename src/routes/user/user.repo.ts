import { Injectable } from '@nestjs/common'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ChangeUserStatusBodyType, CreateUserBodyType, UpdateUserBodyType } from './user.model'
import { Prisma } from '@prisma/client'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'

@Injectable()
export class UserRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list({ where, query }: { where: Prisma.UserWhereInput; query: PaginationQueryType }) {
    const { page, limit } = query
    const skip = (page - 1) * limit
    const [users, totalItems] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              isActive: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prismaService.user.count({ where })
    ])

    return {
      data: users,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: Prisma.UserWhereInput) {
    const users = await this.prismaService.user.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return {
      data: users,
      totalItems: users.length
    }
  }

  async create(data: CreateUserBodyType) {
    return await this.prismaService.user.create({
      data
    })
  }

  async update({ where, data }: { where: Prisma.UserWhereUniqueInput; data: UpdateUserBodyType }) {
    return await this.prismaService.user.update({
      where,
      data
    })
  }

  async changeStatus({ where, data }: { where: Prisma.UserWhereUniqueInput; data: ChangeUserStatusBodyType }) {
    return await this.prismaService.user.update({
      where,
      data
    })
  }

  async delete(where: Prisma.UserWhereUniqueInput) {
    if (envConfig.DELETE_MODE === DeleteMode) {
      return await this.prismaService.user.update({
        where,
        data: { deletedAt: new Date() }
      })
    }
    return await this.prismaService.user.delete({
      where
    })
  }
}
