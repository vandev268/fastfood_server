import { Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'

@Injectable()
export class SharedDraftItemRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async findAllByCode(draftCode: string) {
    return await this.prismaService.draftItem.findMany({
      where: { draftCode },
      include: {
        variant: {
          include: {
            product: true
          }
        },
        tables: true
      }
    })
  }
}
