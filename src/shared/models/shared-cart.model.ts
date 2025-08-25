import { z } from 'zod'
import { ProductSchema, VariantSchema } from './shared-product.model'

export const CartItemSchema = z.object({
  id: z.number(),
  variantId: z.number(),
  userId: z.number(),
  quantity: z.coerce.number().int().positive().min(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const CartItemDetailSchema = CartItemSchema.extend({
  variant: VariantSchema.extend({
    product: ProductSchema
  })
})

export type CartItemType = z.infer<typeof CartItemSchema>
export type CartItemDetailType = z.infer<typeof CartItemDetailSchema>
