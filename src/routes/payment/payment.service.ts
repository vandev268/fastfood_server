import { BadRequestException, ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common'
import { SharedOrderRepo } from 'src/shared/repositories/shared-order.repo'
import {
  MomoPaymentCallbackQueryType,
  GetPaymentLinkBodyType,
  VNPayPaymentCallbackQueryType,
  CreateDineInPaymentBodyType,
  CompleteDineInOrderBodyType
} from './payment.model'
import { getOrderIdByPaymentInfo } from 'src/shared/helpers'
import { OrderStatus } from 'src/shared/constants/order.constant'
import { PaymentMethod, PaymentStatus } from 'src/shared/constants/payment.constant'
import { VNPayService } from 'src/shared/services/vnpay.service'
import { MomoService } from 'src/shared/services/momo.service'
import { v4 as uuidv4 } from 'uuid'
import { PaymentRepo } from './payment.repo'

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepo: PaymentRepo,
    private readonly sharedOrderRepo: SharedOrderRepo,
    private readonly vnpayService: VNPayService,
    private readonly momoService: MomoService
  ) {}

  private async verifyOrderExists(orderId: number) {
    const order = await this.sharedOrderRepo.findUnique({ id: orderId })
    if (!order) {
      throw new NotFoundException('Order not found')
    }
    return order
  }

  async createLink(body: GetPaymentLinkBodyType) {
    const order = await this.verifyOrderExists(body.orderId)
    try {
      if (order.payment.paidAt !== null || order.payment.paymentStatus !== PaymentStatus.Pending) {
        throw new ConflictException('Order has already been paid')
      }
      if (order.payment.paymentMethod === PaymentMethod.VNPay) {
        const url = this.vnpayService.generatePaymentUrl({
          amount: order.finalAmount,
          orderInfo: `Thanh toán đơn hàng #${order.id}`,
          txnRef: `order-${order.id}-${uuidv4()}`
        })
        return {
          url
        }
      }
      if (order.payment.paymentMethod === PaymentMethod.MOMO) {
        const url = await this.momoService.generatePaymentUrl({
          amount: order.finalAmount.toString(),
          orderInfo: `Thanh toán đơn hàng #${order.id}`
        })
        return {
          url: url.payUrl
        }
      }
      throw new BadRequestException('Unsupported payment method')
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException('Failed to create payment link')
    }
  }

  async handleVNPayCallback(query: VNPayPaymentCallbackQueryType) {
    try {
      const { vnp_OrderInfo, vnp_ResponseCode, vnp_Amount, vnp_TransactionNo } = query
      if (!vnp_OrderInfo || !vnp_ResponseCode || !vnp_Amount || !vnp_TransactionNo) {
        throw new BadRequestException('Invalid payment callback data')
      }

      const orderId = getOrderIdByPaymentInfo(vnp_OrderInfo)
      const order = await this.verifyOrderExists(orderId)

      const paymentAmount = Number(vnp_Amount) / 100
      if (order.finalAmount !== paymentAmount) {
        throw new ConflictException('Payment amount does not match order amount')
      }

      if (vnp_ResponseCode === '00' || vnp_ResponseCode === '07') {
        await this.paymentRepo.updatePayment({
          where: { id: orderId },
          data: {
            status: OrderStatus.Confirmed,
            payment: {
              paymentStatus: PaymentStatus.Succeeded,
              paymentMethod: PaymentMethod.VNPay,
              transactionId: vnp_TransactionNo,
              paidAt: new Date()
            }
          }
        })

        return { orderId: order.id, status: PaymentStatus.Succeeded }
      } else {
        await this.paymentRepo.updatePayment({
          where: { id: orderId },
          data: {
            payment: {
              paymentStatus: PaymentStatus.Failed,
              paymentMethod: PaymentMethod.VNPay,
              transactionId: vnp_TransactionNo,
              paidAt: null
            }
          }
        })
        return { orderId: order.id, status: PaymentStatus.Failed }
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException('Failed to process payment callback')
    }
  }

  async handleMomoCallback(query: MomoPaymentCallbackQueryType) {
    try {
      const { orderInfo, resultCode, amount, transId } = query
      if (!orderInfo || !resultCode || !amount || !transId) {
        throw new BadRequestException('Invalid payment callback data')
      }

      const orderId = getOrderIdByPaymentInfo(orderInfo)
      const order = await this.verifyOrderExists(orderId)

      const paymentAmount = Number(amount)
      if (order.finalAmount !== paymentAmount) {
        throw new ConflictException('Payment amount does not match order amount')
      }

      if (resultCode === '0') {
        await this.paymentRepo.updatePayment({
          where: { id: orderId },
          data: {
            status: OrderStatus.Confirmed,
            payment: {
              paymentStatus: PaymentStatus.Succeeded,
              paymentMethod: PaymentMethod.MOMO,
              transactionId: transId,
              paidAt: new Date()
            }
          }
        })
        return { orderId: order.id, status: PaymentStatus.Succeeded }
      } else {
        await this.paymentRepo.updatePayment({
          where: { id: orderId },
          data: {
            payment: {
              paymentStatus: PaymentStatus.Failed,
              paymentMethod: PaymentMethod.MOMO,
              transactionId: transId,
              paidAt: null
            }
          }
        })
        return { orderId: order.id, status: PaymentStatus.Failed }
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException('Failed to process payment callback')
    }
  }

  createDineInPayment(body: CreateDineInPaymentBodyType) {
    try {
      // Generate a unique payment ID for this partial payment
      const paymentId = uuidv4()

      // For now, just return success response
      // In a real implementation, you would:
      // 1. Validate the draft order exists
      // 2. Store the payment record
      // 3. Calculate remaining amount
      // 4. Handle different payment methods (Cash, MOMO, VNPay)

      return {
        message: 'Payment created successfully',
        data: {
          paymentId,
          remainingAmount: Math.max(0, 100000 - body.amount) // Mock calculation
        }
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException('Failed to create dine-in payment')
    }
  }

  completeDineInOrder(body: CompleteDineInOrderBodyType) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { draftOrderId, tableNumber } = body

      // Generate a mock order ID
      const orderId = Math.floor(Math.random() * 10000)

      // In a real implementation, you would:
      // 1. Validate the draft order exists using draftOrderId
      // 2. Check all payments are complete
      // 3. Create the final order record
      // 4. Update table status if needed using tableNumber
      // 5. Send notifications via WebSocket

      return {
        message: 'Order completed successfully',
        data: {
          orderId
        }
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new BadRequestException('Failed to complete dine-in order')
    }
  }
}
