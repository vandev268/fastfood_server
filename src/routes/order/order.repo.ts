/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  ChangeOrderStatusBodyType,
  CreateDeliveryOrderBodyType,
  CreateDeliveryOrderType,
  CreateDineInOrderType,
  CreateOnlineOrderType,
  CreateOrderItemType,
  CreateTakeAwayOrderType,
  OrderQueryType
} from './order.model'
import { Prisma } from '@prisma/client'
import { CartItemDetailType } from 'src/shared/models/shared-cart.model'
import { PaymentMethod } from 'src/shared/constants/payment.constant'
import { OrderProducer } from './order.producer'
import { DraftItemDetailType } from 'src/shared/models/shared-draft-item.model'
import { TableStatus } from 'src/shared/constants/table.constant'
import { SharedUserRepo } from 'src/shared/repositories/shared-user.repo'
import { ReservationStatus } from 'src/shared/constants/reservation.constant'

@Injectable()
export class OrderRepo {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly orderProducer: OrderProducer,
    private readonly sharedUserRepo: SharedUserRepo
  ) {}

  async list(query: OrderQueryType) {
    const { page, limit, orderType, status } = query
    const skip = (page - 1) * limit
    const where: Prisma.OrderWhereInput = {
      deletedAt: null
    }
    if (orderType) {
      where.orderType = orderType
    }
    if (status) {
      where.status = status
    }

    const [orders, totalItems] = await Promise.all([
      this.prismaService.order.findMany({
        where,
        skip,
        take: limit,
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
      }),
      this.prismaService.order.count({ where })
    ])

    return {
      data: orders,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: Prisma.OrderWhereInput) {
    const orders = await this.prismaService.order.findMany({
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
    return {
      data: orders,
      totalItems: orders.length
    }
  }

  async findDetail(where: Prisma.OrderWhereUniqueInput) {
    return await this.prismaService.order.findUnique({
      where,
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

  async createOnline({
    data,
    orderItems,
    cartItems
  }: {
    data: CreateOnlineOrderType
    orderItems: CreateOrderItemType[]
    cartItems: CartItemDetailType[]
  }) {
    return await this.prismaService.$transaction(async (prisma) => {
      // 1. Tạo đơn hàng
      const order$ = prisma.order.create({
        data: {
          ...data,
          orderItems: {
            create: orderItems
          }
        }
      })

      // 2. Cập nhật giỏ hàng
      if (data.userId) {
        await prisma.cartItem.deleteMany({
          where: {
            userId: data.userId,
            id: { in: cartItems.map((item) => item.id) }
          }
        })
      }

      // 3. Cập nhật số lượng biến thể sản phẩm
      const variants$ = Promise.all(
        orderItems
          .filter((item) => item.variantId)
          .map((item) =>
            prisma.variant.update({
              where: { id: item.variantId as number },
              data: {
                stock: {
                  decrement: item.quantity
                }
              }
            })
          )
      )

      // 4. Cập nhật số lượng mã giảm giá được sử dụng (nếu có)
      if (data.couponId) {
        await prisma.coupon.update({
          where: { id: data.couponId },
          data: {
            usageLimit: {
              increment: 1
            }
          }
        })
      }

      const [order] = await Promise.all([order$, variants$])
      if (order.payment.paymentMethod === PaymentMethod.MOMO || order.payment.paymentMethod === PaymentMethod.VNPay) {
        await this.orderProducer.addCancelOrderJob(order.id)
      }
      return order
    })
  }

  async createTakeAway({
    data,
    orderItems,
    draftItems
  }: {
    data: CreateTakeAwayOrderType
    orderItems: CreateOrderItemType[]
    draftItems: DraftItemDetailType[]
  }) {
    return await this.prismaService.$transaction(async (prisma) => {
      // 1. Tạo đơn hàng
      const { couponId, handlerId, draftCode, ...rest } = data
      const order$ = prisma.order.create({
        data: {
          ...rest,
          orderItems: {
            create: orderItems
          },
          coupon: {
            connect: couponId ? { id: couponId } : undefined
          },
          handler: {
            connect: {
              id: handlerId ? handlerId : undefined
            }
          }
        }
      })

      // 2. Xóa tất cả draft items với draftCode
      const draftItems$ = prisma.draftItem.deleteMany({
        where: {
          draftCode: data.draftCode
        }
      })

      // 3. Cập nhật số lượng biến thể sản phẩm
      const variants$ = Promise.all(
        draftItems.map((item) =>
          prisma.variant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        )
      )

      // 4. Cập nhật số lượng mã giảm giá được sử dụng (nếu có)
      const coupon$ = data.couponId
        ? prisma.coupon.update({
            where: { id: data.couponId },
            data: {
              usageLimit: {
                increment: 1
              }
            }
          })
        : Promise.resolve(null)

      const [order] = await Promise.all([order$, variants$, draftItems$, coupon$])
      if (order.payment.paymentMethod === PaymentMethod.MOMO || order.payment.paymentMethod === PaymentMethod.VNPay) {
        await this.orderProducer.addCancelOrderJob(order.id)
      }
      return order
    })
  }

  async createDelivery({
    data,
    orderItems,
    draftItems
  }: {
    data: CreateDeliveryOrderType
    orderItems: CreateOrderItemType[]
    draftItems: DraftItemDetailType[]
  }) {
    return await this.prismaService.$transaction(async (prisma) => {
      // 1. Tạo delivery address ảo với base user của hệ thống
      const clientUser = await this.sharedUserRepo.getBaseUser()
      const { id: deliveryAddressId } = await prisma.address.create({
        data: {
          ...data.deliveryAddress,
          userId: clientUser.id
        }
      })

      // 2. Tạo đơn hàng
      const { couponId, handlerId, draftCode, deliveryAddress, ...rest } = data
      const order$ = prisma.order.create({
        data: {
          ...rest,
          user: {
            connect: {
              id: clientUser.id
            }
          },
          customerName: clientUser.name,
          deliveryAddress: {
            connect: {
              id: deliveryAddressId
            }
          },
          orderItems: {
            create: orderItems
          },
          coupon: {
            connect: couponId ? { id: couponId } : undefined
          },
          handler: {
            connect: {
              id: handlerId ? handlerId : undefined
            }
          }
        }
      })

      // 3. Xóa tất cả draft items với draftCode
      const draftItems$ = prisma.draftItem.deleteMany({
        where: {
          draftCode: data.draftCode
        }
      })

      // 4. Cập nhật số lượng biến thể sản phẩm
      const variants$ = Promise.all(
        draftItems.map((item) =>
          prisma.variant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        )
      )

      // 5. Cập nhật số lượng mã giảm giá được sử dụng (nếu có)
      const coupon$ = data.couponId
        ? prisma.coupon.update({
            where: { id: data.couponId },
            data: {
              usageLimit: {
                increment: 1
              }
            }
          })
        : Promise.resolve(null)

      const [order] = await Promise.all([order$, variants$, draftItems$, coupon$])
      if (order.payment.paymentMethod === PaymentMethod.MOMO || order.payment.paymentMethod === PaymentMethod.VNPay) {
        await this.orderProducer.addCancelOrderJob(order.id)
      }
      return order
    })
  }

  async createDineIn({
    data,
    orderItems,
    draftItems
  }: {
    data: CreateDineInOrderType
    orderItems: CreateOrderItemType[]
    draftItems: DraftItemDetailType[]
  }) {
    return await this.prismaService.$transaction(async (prisma) => {
      const { draftCode, tableIds, couponId, handlerId, userId, reservationId, ...rest } = data

      // 1. Kiểm tra draftitems có tồn tại không để lấy thông tin về các bàn đã chọn
      const existingDraftItems = await prisma.draftItem.findFirst({
        where: {
          draftCode
        },
        include: {
          tables: true
        }
      })

      // 1. Tạo đơn hàng với table connections
      const order$ = prisma.order.create({
        data: {
          ...rest,
          user: {
            connect: userId ? { id: userId } : undefined
          },
          reservation: {
            connect: reservationId ? { id: reservationId } : undefined
          },
          coupon: {
            connect: couponId ? { id: couponId } : undefined
          },
          orderItems: {
            create: orderItems
          },
          tables: {
            connect: existingDraftItems
              ? existingDraftItems.tables.map((table) => ({ id: table.id }))
              : tableIds.map((id) => ({ id }))
          },
          handler: {
            connect: {
              id: handlerId ? handlerId : undefined
            }
          }
        }
      })

      // 2. Xóa tất cả draft items với draftCode
      await prisma.draftItem.deleteMany({
        where: {
          draftCode
        }
      })

      // 3. Cập nhật số lượng biến thể sản phẩm
      console.log('draftItems', draftItems)
      const variants$ = Promise.all(
        draftItems.map((item) => {
          return prisma.variant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity
              }
            }
          })
        })
      )

      // 4. Cập nhật số lượng mã giảm giá được sử dụng (nếu có)
      const coupon$ = data.couponId
        ? prisma.coupon.update({
            where: { id: data.couponId },
            data: {
              usageLimit: {
                increment: 1
              }
            }
          })
        : Promise.resolve(null)

      // 5. Chuyễn tables sang trạng thái cleaning
      if (existingDraftItems && existingDraftItems.tables.length > 0) {
        await prisma.table.updateMany({
          where: {
            id: {
              in: existingDraftItems.tables.map((table) => table.id)
            }
          },
          data: {
            status: TableStatus.Cleaning
          }
        })
      } else {
        await prisma.table.updateMany({
          where: {
            id: {
              in: tableIds
            }
          },
          data: {
            status: TableStatus.Cleaning
          }
        })
      }

      // 6. Chuyễn reservation sang trạng thái completed (nếu có)
      const reservation$ = data.reservationId
        ? prisma.reservation.update({
            where: { id: data.reservationId },
            data: {
              status: ReservationStatus.Completed
            }
          })
        : Promise.resolve(null)

      const [order] = await Promise.all([order$, variants$, coupon$, reservation$])

      // 5. Add cancel job for non-cash payments
      if (order.payment.paymentMethod === PaymentMethod.MOMO || order.payment.paymentMethod === PaymentMethod.VNPay) {
        await this.orderProducer.addCancelOrderJob(order.id)
      }

      return order
    })
  }

  async changeOrderStatus({
    where,
    data,
    handlerId
  }: {
    where: Prisma.OrderWhereUniqueInput
    data: ChangeOrderStatusBodyType
    handlerId: number
  }) {
    return await this.prismaService.order.update({
      where,
      data: {
        status: data.status,
        handlerId: handlerId
      }
    })
  }
}
