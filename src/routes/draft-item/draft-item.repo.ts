import { Injectable } from '@nestjs/common'
import { Prisma, TableStatus } from '@prisma/client'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  AllDraftItemQueryType,
  ChangeDraftItemStatusBodyType,
  ChangeDraftItemTablesBodyType,
  CreateDraftItemBodyType,
  DraftItemQueryType,
  UpdateDraftItemBodyType
} from './draft-item.model'
import { TableType } from 'src/shared/models/shared-table.model'
import { DraftItemWithTablesType } from 'src/shared/models/shared-draft-item.model'

@Injectable()
export class DraftItemRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list(query: DraftItemQueryType) {
    const { tableId, draftCode, page, limit } = query
    const skip = (page - 1) * limit
    const where: Prisma.DraftItemWhereInput = {}
    if (tableId) {
      where.tables = {
        some: {
          id: tableId
        }
      }
    }
    if (draftCode) {
      where.draftCode = draftCode
    }

    const [draftItems, totalItems] = await Promise.all([
      this.prismaService.draftItem.findMany({
        where,
        skip,
        take: limit,
        include: {
          variant: {
            include: {
              product: true
            }
          },
          tables: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prismaService.draftItem.count({ where })
    ])

    return {
      data: draftItems,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(query: AllDraftItemQueryType) {
    const where: Prisma.DraftItemWhereInput = {}
    if (query.tableId) {
      where.tables = {
        some: {
          id: query.tableId
        }
      }
    }
    if (query.draftCode) {
      where.draftCode = query.draftCode
    }
    const draftItems = await this.prismaService.draftItem.findMany({
      where,
      include: {
        variant: {
          include: {
            product: true
          }
        },
        tables: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      data: draftItems,
      totalItems: draftItems.length
    }
  }

  async findUnique(where: Prisma.DraftItemWhereUniqueInput) {
    return await this.prismaService.draftItem.findUnique({
      where
    })
  }

  async findManyWithDraftCode(where: Prisma.DraftItemWhereInput) {
    return await this.prismaService.draftItem.findMany({
      where,
      include: {
        tables: true
      }
    })
  }

  async create(data: CreateDraftItemBodyType) {
    return await this.prismaService.draftItem.upsert({
      where: {
        draftCode_variantId: {
          draftCode: data.draftCode,
          variantId: data.variantId
        }
      },
      create: {
        draftCode: data.draftCode,
        variantId: data.variantId,
        quantity: data.quantity,
        tables: {
          connect: data.tableIds.map((id) => ({ id }))
        }
      },
      update: {
        quantity: {
          increment: data.quantity
        },
        tables: {
          connect: data.tableIds.map((id) => ({ id }))
        }
      }
    })
  }

  async update({ where, data }: { where: Prisma.DraftItemWhereUniqueInput; data: UpdateDraftItemBodyType }) {
    return await this.prismaService.draftItem.update({
      where,
      data: {
        quantity: data.quantity,
        tables: {
          set: data.tableIds.map((id) => ({ id }))
        }
      }
    })
  }

  async changeStatus({
    where,
    data
  }: {
    where: Prisma.DraftItemWhereUniqueInput
    data: ChangeDraftItemStatusBodyType
  }) {
    return await this.prismaService.draftItem.update({
      where,
      data
    })
  }

  async changeTables({
    draftItemsExist,
    data,
    tablesExist
  }: {
    draftItemsExist: DraftItemWithTablesType[]
    data: ChangeDraftItemTablesBodyType
    tablesExist: TableType[]
  }) {
    return await this.prismaService.$transaction(async (prisma) => {
      const tableStatus$ = prisma.table.updateMany({
        where: {
          id: {
            in: tablesExist.map((table) => table.id)
          }
        },
        data: {
          status: TableStatus.Available
        }
      })

      const draftItem$ = draftItemsExist.map((draftItem) => {
        return prisma.draftItem.update({
          where: { id: draftItem.id },
          data: { tables: { set: data.tableIds.map((id) => ({ id })) } }
        })
      })

      const tables$ = prisma.table.updateMany({
        where: {
          id: {
            in: data.tableIds
          }
        },
        data: {
          status: TableStatus.Occupied
        }
      })

      return await Promise.all([tableStatus$, draftItem$, tables$])
    })
  }

  async delete(where: Prisma.DraftItemWhereUniqueInput) {
    return await this.prismaService.draftItem.delete({
      where
    })
  }
}
