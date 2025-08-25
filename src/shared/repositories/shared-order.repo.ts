import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { OrderStatus } from '../constants/order.constant'
import { PaymentStatus } from '../constants/payment.constant'
import { Prisma } from '@prisma/client'

@Injectable()
export class SharedOrderRepo {
  constructor(private readonly prismaService: PrismaService) {}

  private async findWithOrderItems(where: Prisma.OrderWhereUniqueInput) {
    const order = await this.prismaService.order.findUnique({
      where,
      include: {
        orderItems: true
      }
    })
    if (!order) {
      throw new NotFoundException('Order not found')
    }
    return order
  }

  async findUnique(where: Prisma.OrderWhereUniqueInput) {
    return await this.prismaService.order.findUnique({
      where
    })
  }

  async findAll(where?: Prisma.OrderWhereInput) {
    return await this.prismaService.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                product: true
              }
            }
          }
        },
        reviews: true,
        deliveryAddress: {
          include: {
            province: true,
            district: true,
            ward: true
          }
        },
        tables: true,
        reservation: true,
        coupon: true,
        user: {
          omit: {
            totpSecret: true,
            password: true
          }
        },
        handler: {
          omit: {
            totpSecret: true,
            password: true
          }
        }
      }
    })
  }

  async cancelOrderAndPayment(where: Prisma.OrderWhereUniqueInput) {
    const order = await this.findWithOrderItems(where)
    return await this.prismaService.$transaction(async (prisma) => {
      const order$ = prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.Cancelled,
          payment: {
            paymentMethod: order.payment.paymentMethod,
            paymentStatus: PaymentStatus.Failed,
            transactionId: '',
            paidAt: null
          }
        }
      })

      const variants$ = Promise.all(
        order.orderItems
          .filter((item) => item.variantId)
          .map((item) =>
            prisma.variant.update({
              where: { id: item.variantId as number },
              data: { stock: { increment: item.quantity } }
            })
          )
      )
      return await Promise.all([order$, variants$])
    })
  }
}
