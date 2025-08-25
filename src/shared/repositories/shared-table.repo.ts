import { Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class SharedTableRepo {
  constructor(private readonly prismaService: PrismaService) {}
  async findUnique(where: Prisma.TableWhereUniqueInput) {
    return await this.prismaService.table.findUnique({
      where
    })
  }
}
