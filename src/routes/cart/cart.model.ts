import { z } from 'zod'
import { CartItemDetailSchema, CartItemSchema } from 'src/shared/models/shared-cart.model'

export const CartItemParamsSchema = z.object({
  cartItemId: z.coerce.number().int().positive()
})

export const GetCartItemsResSchema = z.object({
  data: z.array(CartItemDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllCartItemsResSchema = GetCartItemsResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateCartItemBodySchema = CartItemSchema.pick({
  variantId: true,
  quantity: true
}).strict()

export const UpdateCartItemBodySchema = CreateCartItemBodySchema

export const DeleteCartItemsBodySchema = z
  .object({
    cartItemIds: z.array(z.coerce.number().int().positive())
  })
  .strict()

export type CartItemParamsType = z.infer<typeof CartItemParamsSchema>
export type GetCartItemsResType = z.infer<typeof GetCartItemsResSchema>
export type GetAllCartItemsResType = z.infer<typeof GetAllCartItemsResSchema>
export type CreateCartItemBodyType = z.infer<typeof CreateCartItemBodySchema>
export type UpdateCartItemBodyType = z.infer<typeof UpdateCartItemBodySchema>
export type DeleteCartItemsBodyType = z.infer<typeof DeleteCartItemsBodySchema>
