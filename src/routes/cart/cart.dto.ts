import { createZodDto } from 'nestjs-zod'
import {
  CartItemParamsSchema,
  CreateCartItemBodySchema,
  DeleteCartItemsBodySchema,
  GetAllCartItemsResSchema,
  GetCartItemsResSchema,
  UpdateCartItemBodySchema
} from './cart.model'
import { CartItemDetailSchema, CartItemSchema } from 'src/shared/models/shared-cart.model'

export class CartItemResDTO extends createZodDto(CartItemSchema) {}
export class CartItemDetaiReslDTO extends createZodDto(CartItemDetailSchema) {}
export class CartItemParamsDTO extends createZodDto(CartItemParamsSchema) {}
export class GetCartItemsResDTO extends createZodDto(GetCartItemsResSchema) {}
export class GetAllCartItemsResDTO extends createZodDto(GetAllCartItemsResSchema) {}
export class CreateCartItemBodyDTO extends createZodDto(CreateCartItemBodySchema) {}
export class UpdateCartItemBodyDTO extends createZodDto(UpdateCartItemBodySchema) {}
export class DeleteCartItemsBodyDTO extends createZodDto(DeleteCartItemsBodySchema) {}
