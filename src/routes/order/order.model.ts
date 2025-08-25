import { z } from 'zod'
import { OrderDetailSchema, OrderItemSchema, OrderSchema } from 'src/shared/models/shared-order.model'
import { PaymentMethod, PaymentStatus } from 'src/shared/constants/payment.constant'
import { PaginationQuerySchema } from 'src/shared/models/request.model'
import { OrderStatus, OrderType } from 'src/shared/constants/order.constant'
import { MessageResSchema } from 'src/shared/models/response.model'
import { CartItemDetailSchema } from 'src/shared/models/shared-cart.model'
import { DraftItemDetailSchema } from 'src/shared/models/shared-draft-item.model'
import { AddressSchema } from 'src/shared/models/shared-address.model'

export const OrderParamsSchema = z.object({
  orderId: z.coerce.number().int().positive()
})

export const OrderQuerySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(OrderStatus).optional(),
  orderType: z.nativeEnum(OrderType).optional()
})

export const GetOrdersResSchema = z.object({
  data: z.array(OrderDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllOrdersResSchema = GetOrdersResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateOrderItemSchema = OrderItemSchema.pick({
  productName: true,
  thumbnail: true,
  variantValue: true,
  quantity: true,
  price: true,
  productId: true,
  variantId: true
})

export const CreateOnlineOrderSchema = OrderSchema.pick({
  userId: true,
  customerName: true,
  orderType: true,
  deliveryAddressId: true,
  couponId: true,
  totalAmount: true,
  feeAmount: true,
  discountAmount: true,
  finalAmount: true,
  payment: true,
  status: true,
  note: true
})

export const CreateOnlineOrderBodySchema = OrderSchema.pick({
  deliveryAddressId: true,
  couponId: true,
  note: true
})
  .extend({
    paymentMethod: z.nativeEnum(PaymentMethod),
    cartItems: z.array(CartItemDetailSchema).min(1)
  })
  .strict()

export const CreateTakeAwayOrderBodySchema = OrderSchema.pick({
  couponId: true,
  note: true
})
  .extend({
    paymentMethod: z.nativeEnum(PaymentMethod),
    draftCode: z.string(),
    draftItems: z.array(DraftItemDetailSchema).min(1)
  })
  .strict()

export const CreateTakeAwayOrderSchema = OrderSchema.pick({
  customerName: true,
  orderType: true,
  couponId: true,
  totalAmount: true,
  feeAmount: true,
  discountAmount: true,
  finalAmount: true,
  payment: true,
  status: true,
  note: true,
  handlerId: true
}).extend({
  draftCode: z.string()
})

export const CreateDeliveryOrderBodySchema = OrderSchema.pick({
  couponId: true,
  note: true
})
  .extend({
    paymentMethod: z.nativeEnum(PaymentMethod),
    draftCode: z.string(),
    draftItems: z.array(DraftItemDetailSchema).min(1),
    deliveryAddress: AddressSchema.pick({
      recipientName: true,
      recipientPhone: true,
      provinceId: true,
      districtId: true,
      wardId: true,
      detailAddress: true,
      deliveryNote: true
    })
  })
  .strict()

export const CreateDeliveryOrderSchema = OrderSchema.pick({
  orderType: true,
  couponId: true,
  totalAmount: true,
  feeAmount: true,
  discountAmount: true,
  finalAmount: true,
  payment: true,
  status: true,
  note: true,
  handlerId: true
}).extend({
  draftCode: z.string(),
  deliveryAddress: AddressSchema.pick({
    recipientName: true,
    recipientPhone: true,
    provinceId: true,
    districtId: true,
    wardId: true,
    detailAddress: true,
    deliveryNote: true
  })
})

export const CreateDineInOrderSchema = OrderSchema.pick({
  userId: true,
  customerName: true,
  orderType: true,
  couponId: true,
  totalAmount: true,
  feeAmount: true,
  discountAmount: true,
  reservationId: true,
  finalAmount: true,
  payment: true,
  status: true,
  note: true,
  handlerId: true
}).extend({
  tableIds: z.array(z.number().int().positive()).min(1),
  draftCode: z.string()
})

export const CreateDineInOrderBodySchema = OrderSchema.pick({
  orderType: true,
  couponId: true,
  note: true
})
  .extend({
    paymentMethod: z.nativeEnum(PaymentMethod),
    draftCode: z.string(),
    draftItems: z.array(DraftItemDetailSchema).min(1),
    tableIds: z.array(z.number().int().positive()).min(1),
    reservationId: z.number().int().positive().nullable()
  })
  .strict()

export const CreateOrderResSchema = MessageResSchema.extend({
  orderId: z.number(),
  paymentStatus: z.nativeEnum(PaymentStatus),
  paymentUrl: z.string().optional()
})

export const ChangeOrderStatusBodySchema = OrderSchema.pick({
  status: true
}).strict()

export type OrderParamsType = z.infer<typeof OrderParamsSchema>
export type OrderQueryType = z.infer<typeof OrderQuerySchema>
export type GetOrdersResType = z.infer<typeof GetOrdersResSchema>
export type GetAllOrdersResType = z.infer<typeof GetAllOrdersResSchema>
export type CreateOnlineOrderType = z.infer<typeof CreateOnlineOrderSchema>
export type CreateOnlineOrderBodyType = z.infer<typeof CreateOnlineOrderBodySchema>
export type CreateTakeAwayOrderBodyType = z.infer<typeof CreateTakeAwayOrderBodySchema>
export type CreateTakeAwayOrderType = z.infer<typeof CreateTakeAwayOrderSchema>
export type CreateDeliveryOrderBodyType = z.infer<typeof CreateDeliveryOrderBodySchema>
export type CreateDeliveryOrderType = z.infer<typeof CreateDeliveryOrderSchema>
export type CreateDineInOrderType = z.infer<typeof CreateDineInOrderSchema>
export type CreateDineInOrderBodyType = z.infer<typeof CreateDineInOrderBodySchema>
export type CreateOrderResType = z.infer<typeof CreateOrderResSchema>
export type CreateOrderItemType = z.infer<typeof CreateOrderItemSchema>
export type ChangeOrderStatusBodyType = z.infer<typeof ChangeOrderStatusBodySchema>
