import { Injectable } from '@nestjs/common'
import { PaymentStatus } from 'src/shared/constants/payment.constant'
import { OrderType } from 'src/shared/models/shared-order.model'
import { PrismaService } from 'src/shared/services/prisma.service'
import { PaymentProducer } from './payment.producer'

@Injectable()
export class PaymentRepo {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly paymentProducer: PaymentProducer
  ) {}

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

      if (order.payment.paymentStatus === PaymentStatus.Succeeded) {
        await this.paymentProducer.removeCancelOrderJob(order.id)
      }

      return order
    })
  }
}
