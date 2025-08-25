import { Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class SharedReservationRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async findUnique(where: Prisma.ReservationWhereUniqueInput) {
    return await this.prismaService.reservation.findUnique({
      where
    })
  }

  async findAllWithTable(where: Prisma.ReservationWhereInput) {
    return await this.prismaService.reservation.findMany({
      where,
      include: {
        table: {
          select: {
            id: true,
            code: true,
            capacity: true,
            status: true,
            location: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }
}
