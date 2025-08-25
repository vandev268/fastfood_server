import { Injectable } from '@nestjs/common'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ChangeRoleStatusBodyType, CreateRoleBodyType, UpdateRoleBodyType } from './role.model'
import { Prisma } from '@prisma/client'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'

@Injectable()
export class RoleRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list({ where, query }: { where: Prisma.RoleWhereInput; query: PaginationQueryType }) {
    const { limit, page } = query
    const skip = limit * (page - 1)
    const [roles, totalItems] = await Promise.all([
      this.prismaService.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prismaService.role.count({ where })
    ])
    return {
      data: roles,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: Prisma.RoleWhereInput) {
    const roles = await this.prismaService.role.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    })
    return {
      data: roles,
      totalItems: roles.length
    }
  }

  async findDetail(where: Prisma.RoleWhereUniqueInput) {
    return await this.prismaService.role.findUnique({
      where,
      include: {
        permissions: true
      }
    })
  }

  async create(data: CreateRoleBodyType) {
    return await this.prismaService.role.create({
      data
    })
  }

  async update({ where, data }: { where: Prisma.RoleWhereUniqueInput; data: UpdateRoleBodyType }) {
    return await this.prismaService.role.update({
      where,
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        permissions: {
          set: data.permissionIds.map((id) => ({ id }))
        }
      }
    })
  }

  async changeStatus({ where, data }: { where: Prisma.RoleWhereUniqueInput; data: ChangeRoleStatusBodyType }) {
    return await this.prismaService.role.update({
      where,
      data
    })
  }

  async delete(where: Prisma.RoleWhereUniqueInput) {
    if (envConfig.DELETE_MODE === DeleteMode) {
      return await this.prismaService.role.update({
        where,
        data: { deletedAt: new Date() }
      })
    }
    return await this.prismaService.role.delete({
      where
    })
  }
}
