import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ChangeTableStatusBodyType, CreateTableBodyType, UpdateTableBodyType } from './table.model'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { Prisma } from '@prisma/client'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'

@Injectable()
export class TableRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list({ where, query }: { where: Prisma.TableWhereInput; query: PaginationQueryType }) {
    const { page, limit } = query
    const skip = limit * (page - 1)
    const [tables, totalItems] = await Promise.all([
      this.prismaService.table.findMany({
        where,
        include: {
          orders: true,
          reservations: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prismaService.table.count({ where })
    ])

    return {
      data: tables,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: Prisma.TableWhereInput) {
    const tables = await this.prismaService.table.findMany({
      where,
      include: {
        orders: true,
        reservations: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return {
      data: tables,
      totalItems: tables.length
    }
  }

  async findUnique(where: Prisma.TableWhereUniqueInput) {
    return await this.prismaService.table.findUnique({
      where
    })
  }

  async findDetail(where: Prisma.TableWhereUniqueInput) {
    return await this.prismaService.table.findUnique({
      where,
      include: {
        orders: true,
        reservations: true
      }
    })
  }

  async create(data: CreateTableBodyType) {
    return await this.prismaService.table.create({
      data
    })
  }

  async update({ where, data }: { where: Prisma.TableWhereUniqueInput; data: UpdateTableBodyType }) {
    return await this.prismaService.table.update({
      where,
      data
    })
  }

  async changeStatus({ where, data }: { where: Prisma.TableWhereUniqueInput; data: ChangeTableStatusBodyType }) {
    return await this.prismaService.table.update({
      where,
      data
    })
  }

  async delete(where: Prisma.TableWhereUniqueInput) {
    if (envConfig.DELETE_MODE === DeleteMode) {
      return await this.prismaService.table.update({
        where,
        data: { deletedAt: new Date() }
      })
    }
    return await this.prismaService.table.delete({
      where
    })
  }
}
