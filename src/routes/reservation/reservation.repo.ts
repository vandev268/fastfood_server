import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  ChangeReservationStatusBodyType,
  CreateReservationBodyType,
  UpdateReservationBodyType
} from './reservation.model'
import { TableStatus } from 'src/shared/constants/table.constant'

@Injectable()
export class ReservationRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list({ where, query }: { where: Prisma.ReservationWhereInput; query: PaginationQueryType }) {
    const { page, limit } = query
    const [reservations, totalItems] = await Promise.all([
      this.prismaService.reservation.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              avatar: true
            }
          },
          table: {
            select: {
              id: true,
              code: true,
              capacity: true,
              status: true,
              location: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      this.prismaService.reservation.count({ where })
    ])

    return {
      data: reservations,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: Prisma.ReservationWhereInput) {
    const reservations = await this.prismaService.reservation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            avatar: true
          }
        },
        table: {
          select: {
            id: true,
            code: true,
            capacity: true,
            status: true,
            location: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return {
      data: reservations,
      totalItems: reservations.length
    }
  }

  async findUnique(where: Prisma.ReservationWhereUniqueInput) {
    return await this.prismaService.reservation.findUnique({
      where
    })
  }

  async findExists(where: Prisma.ReservationWhereInput) {
    return await this.prismaService.reservation.findFirst({
      where
    })
  }

  async findDetail(where: Prisma.ReservationWhereUniqueInput) {
    return await this.prismaService.reservation.findUnique({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            avatar: true
          }
        },
        table: {
          select: {
            id: true,
            code: true,
            capacity: true,
            status: true,
            location: true
          }
        }
      }
    })
  }

  async create(data: CreateReservationBodyType) {
    const [, reservation] = await this.prismaService.$transaction([
      // 1. Cập nhật bản ghi bàn được đặt
      this.prismaService.table.update({
        where: { id: data.tableId, deletedAt: null },
        data: { status: TableStatus.Reserved }
      }),

      // 2. Tạo bản ghi đặt chỗ
      this.prismaService.reservation.create({
        data
      })
    ])
    return reservation
  }

  async update({
    where,
    data,
    oldTableId
  }: {
    where: Prisma.ReservationWhereUniqueInput
    data: UpdateReservationBodyType
    oldTableId: number
  }) {
    return await this.prismaService.$transaction(async (prisma) => {
      // 1. Cập nhật đặt chỗ
      const result = await prisma.reservation.update({
        where,
        data
      })

      // 2. Cập nhật trạng thái bàn
      await prisma.table.update({
        where: { id: data.tableId, deletedAt: null },
        data: { status: TableStatus.Reserved }
      })

      // 3. Nếu bàn được cập nhật khác với bàn cũ, cập nhật trạng thái bàn cũ
      if (oldTableId !== data.tableId) {
        await prisma.table.update({
          where: { id: oldTableId, deletedAt: null },
          data: { status: TableStatus.Available }
        })
      }

      return result
    })
  }
  async changeStatus({
    where,
    data
  }: {
    where: Prisma.ReservationWhereUniqueInput
    data: ChangeReservationStatusBodyType
  }) {
    return await this.prismaService.reservation.update({
      where,
      data
    })
  }
}
