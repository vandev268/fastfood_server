import { z } from 'zod'
import { OrderStatus, OrderType } from '../constants/order.constant'
import { PaymentSchema } from './shared-payment.model'
import { UserSchema } from './shared-user.model'
import { TableSchema } from './shared-table.model'
import { ProductSchema, VariantSchema } from './shared-product.model'
import { CouponSchema } from './shared-coupon.model'
import { AddressDetailSchema } from './shared-address.model'
import { ReservationSchema } from './shared-reservation.model'
import { ReviewSchema } from './shared-review.model'

export const OrderSchema = z.object({
  id: z.number(),
  orderType: z.nativeEnum(OrderType),
  customerName: z.string().max(500).default(''),
  userId: z.number().nullable(),
  deliveryAddressId: z.number().nullable(),
  reservationId: z.number().nullable(),
  couponId: z.number().nullable(),
  totalAmount: z.number().positive(),
  feeAmount: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  finalAmount: z.number().nonnegative(),
  payment: PaymentSchema,
  note: z.string().default(''),
  status: z.nativeEnum(OrderStatus),
  handlerId: z.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const OrderItemSchema = z.object({
  id: z.number(),
  productName: z.string(),
  thumbnail: z.string(),
  variantValue: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  orderId: z.number().int(),
  productId: z.number().int().nullable(),
  variantId: z.number().int().nullable(),
  createdAt: z.date()
})

export const OrderDetailSchema = OrderSchema.extend({
  orderItems: z.array(
    OrderItemSchema.extend({
      variant: VariantSchema.extend({
        product: ProductSchema.nullable()
      }).nullable()
    })
  ),
  reviews: z.array(ReviewSchema),
  user: UserSchema.omit({ totpSecret: true, password: true }).nullable(),
  deliveryAddress: AddressDetailSchema.nullable(),
  tables: z.array(TableSchema),
  reservation: ReservationSchema.nullable(),
  coupon: CouponSchema.nullable(),
  handler: UserSchema.omit({ totpSecret: true, password: true }).nullable()
})

export type OrderType = z.infer<typeof OrderSchema>
export type OrderItemType = z.infer<typeof OrderItemSchema>
export type OrderDetailType = z.infer<typeof OrderDetailSchema>
