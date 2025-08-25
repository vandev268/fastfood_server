import { ConflictException, HttpException, Injectable, NotFoundException } from '@nestjs/common'
import { OrderRepo } from './order.repo'
import {
  ChangeOrderStatusBodyType,
  CreateDeliveryOrderBodyType,
  CreateDineInOrderBodyType,
  CreateOnlineOrderBodyType,
  CreateTakeAwayOrderBodyType,
  OrderQueryType
} from './order.model'
import { isNotFoundPrismaError } from 'src/shared/helpers'
import { OrderFee, OrderStatus, OrderType } from 'src/shared/constants/order.constant'
import { SharedCouponRepo } from 'src/shared/repositories/shared-coupon.repo'
import { CouponDiscountType } from 'src/shared/constants/coupon.constant'
import { PaymentMethod, PaymentStatus } from 'src/shared/constants/payment.constant'
import { VNPayService } from 'src/shared/services/vnpay.service'
import { MomoService } from 'src/shared/services/momo.service'
import { UserDetailType } from 'src/shared/models/shared-user.model'
import { SharedOrderRepo } from 'src/shared/repositories/shared-order.repo'
import { CouponType } from 'src/shared/models/shared-coupon.model'
import { SharedDraftItemRepo } from 'src/shared/repositories/shared-draft-item.repo'
import { SharedTableRepo } from 'src/shared/repositories/shared-table.repo'
import { SharedReservationRepo } from 'src/shared/repositories/shared-reservation.repo'

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepo,
    private readonly sharedOrderRepo: SharedOrderRepo,
    private readonly sharedCouponRepo: SharedCouponRepo,
    private readonly vnpayService: VNPayService,
    private readonly momoService: MomoService,
    private readonly sharedTableRepo: SharedTableRepo,
    private readonly sharedReservationRepo: SharedReservationRepo,
    private readonly sharedDraftItemRepo: SharedDraftItemRepo
  ) {}

  private async verifyTableIdsExist(tableIds: number[]) {
    for (const tableId of tableIds) {
      const table = await this.sharedTableRepo.findUnique({ id: tableId, deletedAt: null })
      if (!table) {
        throw new NotFoundException(`Table with ID ${tableId} not found`)
      }
    }
    return true
  }

  async list(query: OrderQueryType) {
    return await this.orderRepo.list(query)
  }

  async findAll() {
    return await this.orderRepo.findAll({ deletedAt: null })
  }

  async findDetail(orderId: number) {
    const order = await this.orderRepo.findDetail({ id: orderId, deletedAt: null })
    if (!order) {
      throw new NotFoundException('Order not found')
    }
    return order
  }

  async createOnlineOrder(user: UserDetailType, data: CreateOnlineOrderBodyType) {
    try {
      let coupon: CouponType | null = null
      if (data.couponId) {
        coupon = await this.sharedCouponRepo.findUnique({ id: data.couponId, deletedAt: null })
        if (!coupon) {
          throw new NotFoundException('Coupon not found')
        }
      }

      const totalAmount = data.cartItems.reduce((total, cur) => total + cur.variant.price * cur.quantity, 0)
      const discountAmount = coupon
        ? coupon.discountType === CouponDiscountType.Percent
          ? totalAmount * (coupon.discountValue / 100)
          : coupon.discountValue
        : 0
      const feeAmount = coupon
        ? coupon.discountType === CouponDiscountType.Percent
          ? OrderFee.Delivery + OrderFee.TaxRate * discountAmount
          : OrderFee.Delivery + OrderFee.TaxRate * totalAmount
        : OrderFee.Delivery + OrderFee.TaxRate * totalAmount
      const finalAmount = totalAmount + feeAmount - discountAmount

      const order = await this.orderRepo.createOnline({
        data: {
          userId: user.id,
          customerName: user.name,
          orderType: OrderType.Delivery,
          deliveryAddressId: data.deliveryAddressId,
          couponId: data.couponId,
          totalAmount: Math.round(totalAmount),
          feeAmount: Math.round(feeAmount),
          discountAmount: Math.round(discountAmount),
          finalAmount: finalAmount <= 0 ? 0 : Math.round(finalAmount),
          payment: {
            paymentMethod: data.paymentMethod,
            paymentStatus: PaymentStatus.Pending,
            paidAt: null,
            transactionId: ''
          },
          status: OrderStatus.Pending,
          note: data.note
        },
        orderItems: data.cartItems.map((item) => ({
          productId: item.variant.product.id,
          variantId: item.variant.id,
          productName: item.variant.product.name,
          variantValue: item.variant.value,
          quantity: item.quantity,
          price: item.variant.price,
          thumbnail:
            item.variant.thumbnail ||
            item.variant.product.images[0] ||
            'https://nestjs-ecommerce-clone.s3.ap-southeast-1.amazonaws.com/bases/236998c8-9fe3-42f8-95fd-5a3d5247a681.png'
        })),
        cartItems: data.cartItems
      })

      if (data.paymentMethod === PaymentMethod.VNPay) {
        const paymentUrl = this.vnpayService.generatePaymentUrl({
          amount: order.finalAmount,
          orderInfo: `Thanh toán đơn hàng #${order.id}`
        })
        return {
          message: 'Order created successfully, please proceed to payment',
          orderId: order.id,
          paymentStatus: order.payment.paymentStatus,
          paymentUrl
        }
      } else if (data.paymentMethod === PaymentMethod.MOMO) {
        const paymentUrl = await this.momoService.generatePaymentUrl({
          orderInfo: `Thanh toán đơn hàng #${order.id}`,
          amount: order.finalAmount.toString()
        })
        return {
          message: 'Order created successfully, please proceed to payment',
          orderId: order.id,
          paymentStatus: order.payment.paymentStatus,
          paymentUrl: paymentUrl.payUrl
        }
      }

      return {
        message: 'Order created successfully',
        orderId: order.id,
        paymentStatus: order.payment.paymentStatus
      }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException('Delivery address not found')
      }
      if (error instanceof HttpException) {
        throw error
      }
      throw error
    }
  }

  async createTakeAwayOrder(user: UserDetailType, data: CreateTakeAwayOrderBodyType) {
    try {
      let coupon: CouponType | null = null
      if (data.couponId) {
        coupon = await this.sharedCouponRepo.findUnique({ id: data.couponId, deletedAt: null })
        if (!coupon) {
          throw new NotFoundException('Coupon not found')
        }
      }

      const totalAmount = data.draftItems.reduce((total, cur) => total + cur.variant.price * cur.quantity, 0)
      const discountAmount = coupon
        ? coupon.discountType === CouponDiscountType.Percent
          ? totalAmount * (coupon.discountValue / 100)
          : coupon.discountValue
        : 0
      const feeAmount = coupon
        ? coupon.discountType === CouponDiscountType.Percent
          ? OrderFee.TaxRate * discountAmount
          : OrderFee.TaxRate * totalAmount
        : OrderFee.TaxRate * totalAmount
      const finalAmount = totalAmount + feeAmount - discountAmount

      const order = await this.orderRepo.createTakeAway({
        data: {
          customerName: 'Khách hàng',
          orderType: OrderType.Takeaway,
          couponId: data.couponId,
          totalAmount: Math.round(totalAmount),
          feeAmount: Math.round(feeAmount),
          discountAmount: Math.round(discountAmount),
          finalAmount: finalAmount <= 0 ? 0 : Math.round(finalAmount),
          payment: {
            paymentMethod: data.paymentMethod,
            paymentStatus: PaymentStatus.Pending,
            paidAt: null,
            transactionId: ''
          },
          status: OrderStatus.Completed,
          note: data.note,
          handlerId: user.id,
          draftCode: data.draftCode
        },
        orderItems: data.draftItems.map((item) => ({
          productId: item.variant.product.id,
          variantId: item.variant.id,
          productName: item.variant.product.name,
          variantValue: item.variant.value,
          quantity: item.quantity,
          price: item.variant.price,
          thumbnail:
            item.variant.thumbnail ||
            item.variant.product.images[0] ||
            'https://nestjs-ecommerce-clone.s3.ap-southeast-1.amazonaws.com/bases/236998c8-9fe3-42f8-95fd-5a3d5247a681.png'
        })),
        draftItems: data.draftItems
      })

      if (data.paymentMethod === PaymentMethod.VNPay) {
        const paymentUrl = this.vnpayService.generatePaymentUrl({
          amount: order.finalAmount,
          orderInfo: `Thanh toán đơn hàng #${order.id}`
        })
        return {
          message: 'Order created successfully, please proceed to payment',
          orderId: order.id,
          paymentStatus: order.payment.paymentStatus,
          paymentUrl
        }
      } else if (data.paymentMethod === PaymentMethod.MOMO) {
        const paymentUrl = await this.momoService.generatePaymentUrl({
          orderInfo: `Thanh toán đơn hàng #${order.id}`,
          amount: order.finalAmount.toString()
        })
        return {
          message: 'Order created successfully, please proceed to payment',
          orderId: order.id,
          paymentStatus: order.payment.paymentStatus,
          paymentUrl: paymentUrl.payUrl
        }
      }

      return {
        message: 'Takeaway order created successfully',
        orderId: order.id,
        paymentStatus: order.payment.paymentStatus
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw error
    }
  }

  async createDeliveryOrder({ handler, data }: { handler: UserDetailType; data: CreateDeliveryOrderBodyType }) {
    try {
      let coupon: CouponType | null = null
      if (data.couponId) {
        coupon = await this.sharedCouponRepo.findUnique({ id: data.couponId, deletedAt: null })
        if (!coupon) {
          throw new NotFoundException('Coupon not found')
        }
      }

      const totalAmount = data.draftItems.reduce((total, cur) => total + cur.variant.price * cur.quantity, 0)
      const discountAmount = coupon
        ? coupon.discountType === CouponDiscountType.Percent
          ? totalAmount * (coupon.discountValue / 100)
          : coupon.discountValue
        : 0
      const feeAmount = coupon
        ? coupon.discountType === CouponDiscountType.Percent
          ? OrderFee.Delivery + OrderFee.TaxRate * discountAmount
          : OrderFee.Delivery + OrderFee.TaxRate * totalAmount
        : OrderFee.Delivery + OrderFee.TaxRate * totalAmount
      const finalAmount = totalAmount + feeAmount - discountAmount

      const order = await this.orderRepo.createDelivery({
        data: {
          orderType: OrderType.Delivery,
          couponId: data.couponId,
          totalAmount: Math.round(totalAmount),
          feeAmount: Math.round(feeAmount),
          discountAmount: Math.round(discountAmount),
          finalAmount: finalAmount <= 0 ? 0 : Math.round(finalAmount),
          payment: {
            paymentMethod: data.paymentMethod,
            paymentStatus: PaymentStatus.Pending,
            paidAt: null,
            transactionId: ''
          },
          status: OrderStatus.Confirmed,
          note: data.note,
          handlerId: handler.id,
          draftCode: data.draftCode,
          deliveryAddress: data.deliveryAddress
        },
        orderItems: data.draftItems.map((item) => ({
          productId: item.variant.product.id,
          variantId: item.variant.id,
          productName: item.variant.product.name,
          variantValue: item.variant.value,
          quantity: item.quantity,
          price: item.variant.price,
          thumbnail:
            item.variant.thumbnail ||
            item.variant.product.images[0] ||
            'https://nestjs-ecommerce-clone.s3.ap-southeast-1.amazonaws.com/bases/236998c8-9fe3-42f8-95fd-5a3d5247a681.png'
        })),
        draftItems: data.draftItems
      })

      if (data.paymentMethod === PaymentMethod.VNPay) {
        const paymentUrl = this.vnpayService.generatePaymentUrl({
          amount: order.finalAmount,
          orderInfo: `Thanh toán đơn hàng #${order.id}`
        })
        return {
          message: 'Order created successfully, please proceed to payment',
          orderId: order.id,
          paymentStatus: order.payment.paymentStatus,
          paymentUrl
        }
      } else if (data.paymentMethod === PaymentMethod.MOMO) {
        const paymentUrl = await this.momoService.generatePaymentUrl({
          orderInfo: `Thanh toán đơn hàng #${order.id}`,
          amount: order.finalAmount.toString()
        })
        return {
          message: 'Order created successfully, please proceed to payment',
          orderId: order.id,
          paymentStatus: order.payment.paymentStatus,
          paymentUrl: paymentUrl.payUrl
        }
      }

      return {
        message: 'Takeaway order created successfully',
        orderId: order.id,
        paymentStatus: order.payment.paymentStatus
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw error
    }
  }

  async createDineInOrder({ handler, data }: { handler: UserDetailType; data: CreateDineInOrderBodyType }) {
    try {
      await this.verifyTableIdsExist(data.tableIds)
      const draftItems = await this.sharedDraftItemRepo.findAllByCode(data.draftCode)
      if (!draftItems || draftItems.length === 0) {
        throw new NotFoundException('No draft items found for this order')
      }

      let userId: number | null = null
      let customerName: string = 'Guest'
      if (data.reservationId) {
        const reservation = await this.sharedReservationRepo.findUnique({
          id: data.reservationId,
          deletedAt: null
        })
        if (!reservation) {
          throw new NotFoundException('Reservation not found')
        }
        userId = reservation.userId
        customerName = reservation.guestName
      }

      let coupon: CouponType | null = null
      if (data.couponId) {
        coupon = await this.sharedCouponRepo.findUnique({ id: data.couponId, deletedAt: null })
        if (!coupon) {
          throw new NotFoundException('Coupon not found')
        }
      }

      const totalAmount = data.draftItems.reduce((total, cur) => total + cur.variant.price * cur.quantity, 0)
      const discountAmount = coupon
        ? coupon.discountType === CouponDiscountType.Percent
          ? totalAmount * (coupon.discountValue / 100)
          : coupon.discountValue
        : 0
      const feeAmount = coupon
        ? coupon.discountType === CouponDiscountType.Percent
          ? OrderFee.TaxRate * discountAmount
          : OrderFee.TaxRate * totalAmount
        : OrderFee.TaxRate * totalAmount
      const finalAmount = totalAmount + feeAmount - discountAmount

      const order = await this.orderRepo.createDineIn({
        data: {
          draftCode: data.draftCode,
          tableIds: data.tableIds,
          reservationId: data.reservationId,
          userId,
          customerName,
          orderType: data.orderType,
          couponId: data.couponId,
          totalAmount: Math.round(totalAmount),
          feeAmount: Math.round(feeAmount),
          discountAmount: Math.round(discountAmount),
          finalAmount: finalAmount <= 0 ? 0 : Math.round(finalAmount),
          payment: {
            paymentMethod: data.paymentMethod,
            paymentStatus: PaymentStatus.Pending,
            paidAt: null,
            transactionId: ''
          },
          status: OrderStatus.Completed,
          note: data.note,
          handlerId: handler.id
        },
        orderItems: data.draftItems.map((item) => ({
          productId: item.variant.product.id,
          variantId: item.variant.id,
          productName: item.variant.product.name,
          variantValue: item.variant.value,
          quantity: item.quantity,
          price: item.variant.price,
          thumbnail:
            item.variant.thumbnail ||
            item.variant.product.images[0] ||
            'https://nestjs-ecommerce-clone.s3.ap-southeast-1.amazonaws.com/bases/236998c8-9fe3-42f8-95fd-5a3d5247a681.png'
        })),
        draftItems: data.draftItems
      })

      if (data.paymentMethod === PaymentMethod.VNPay) {
        const paymentUrl = this.vnpayService.generatePaymentUrl({
          amount: order.finalAmount,
          orderInfo: `Thanh toán đơn hàng #${order.id}`
        })
        return {
          message: 'Order created successfully, please proceed to payment',
          orderId: order.id,
          paymentStatus: order.payment.paymentStatus,
          paymentUrl
        }
      } else if (data.paymentMethod === PaymentMethod.MOMO) {
        const paymentUrl = await this.momoService.generatePaymentUrl({
          orderInfo: `Thanh toán đơn hàng #${order.id}`,
          amount: order.finalAmount.toString()
        })
        return {
          message: 'Order created successfully, please proceed to payment',
          orderId: order.id,
          paymentStatus: order.payment.paymentStatus,
          paymentUrl: paymentUrl.payUrl
        }
      }

      return {
        message: 'Order created successfully',
        orderId: order.id,
        paymentStatus: order.payment.paymentStatus
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw error
    }
  }

  async changeOrderStatus({
    user,
    orderId,
    data
  }: {
    user: UserDetailType
    orderId: number
    data: ChangeOrderStatusBodyType
  }) {
    const order = await this.sharedOrderRepo.findUnique({ id: orderId, deletedAt: null })
    if (!order) {
      throw new NotFoundException('Order not found')
    }
    if (order.status === OrderStatus.Completed || order.status === OrderStatus.Cancelled) {
      throw new ConflictException('Order has already been completed or cancelled')
    }

    const updatedOrder = await this.orderRepo.changeOrderStatus({
      where: { id: orderId },
      data: { status: data.status },
      handlerId: user.id
    })

    return {
      message: 'Order status changed successfully',
      order: updatedOrder
    }
  }
}
