import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { CreatePermissionBodyType, UpdatePermissionBodyType } from './permission.model'
import { Prisma } from '@prisma/client'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'

@Injectable()
export class PermissionRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list({ where, query }: { where: Prisma.PermissionWhereInput; query: PaginationQueryType }) {
    const { limit, page } = query
    const skip = limit * (page - 1)
    const [data, totalItems] = await Promise.all([
      this.prismaService.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prismaService.permission.count({ where })
    ])

    return {
      data,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: Prisma.PermissionWhereInput) {
    const permissions = await this.prismaService.permission.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    return {
      data: permissions,
      totalItems: permissions.length
    }
  }

  async findUnique(where: Prisma.PermissionWhereUniqueInput) {
    return this.prismaService.permission.findUnique({
      where
    })
  }

  async create(data: CreatePermissionBodyType) {
    return this.prismaService.permission.create({
      data
    })
  }

  async update({ where, data }: { where: Prisma.PermissionWhereUniqueInput; data: UpdatePermissionBodyType }) {
    return this.prismaService.permission.update({
      where,
      data
    })
  }

  async delete(where: Prisma.PermissionWhereUniqueInput) {
    if (envConfig.DELETE_MODE === DeleteMode) {
      return await this.prismaService.permission.update({
        where,
        data: { deletedAt: new Date() }
      })
    }
    return this.prismaService.permission.delete({
      where
    })
  }
}
