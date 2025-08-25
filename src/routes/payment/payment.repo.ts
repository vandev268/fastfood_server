import { Injectable } from '@nestjs/common'
import { OrderType } from 'src/shared/models/shared-order.model'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class PaymentRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async updatePayment({
    where,
    data
  }: {
    where: { id: number }
    data: Partial<Pick<OrderType, 'status' | 'payment'>>
  }) {
    return await this.prismaService.$transaction(async (prisma) => {
      const order = await prisma.order.update({
        where,
        data
      })
      return order
    })
  }
}
