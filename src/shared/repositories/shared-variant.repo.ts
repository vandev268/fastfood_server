import { Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { Prisma } from '@prisma/client'

@Injectable()
export class SharedVariantRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async findUnique(where: Prisma.VariantWhereUniqueInput) {
    return await this.prismaService.variant.findUnique({
      where
    })
  }
}
