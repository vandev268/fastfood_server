import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { CartRepo } from './cart.repo'
import { CreateCartItemBodyType, DeleteCartItemsBodyType } from './cart.model'
import { isNotFoundPrismaError } from 'src/shared/helpers'
import { SharedVariantRepo } from 'src/shared/repositories/shared-variant.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepo: CartRepo,
    private readonly sharedVariantRepo: SharedVariantRepo
  ) {}

  private async verifyCartItemExists(cartItemId: number) {
    const cartItem = await this.cartRepo.findUnique({ id: cartItemId })
    if (!cartItem) {
      throw new NotFoundException(`Cart item not found`)
    }
    return cartItem
  }

  private async verifyVariantAndQuantity(variantId: number, quantity: number) {
    const variant = await this.sharedVariantRepo.findUnique({ id: variantId })
    if (!variant) {
      throw new NotFoundException(`Variant not found`)
    }
    if (variant.stock < 1 || variant.stock < quantity) {
      throw new ConflictException(`Out of stock for variant`)
    }
    return variant
  }

  async list(userId: number, query: PaginationQueryType) {
    return await this.cartRepo.list({ where: { userId }, query })
  }

  async findAll(userId: number) {
    return await this.cartRepo.findAll({ userId })
  }

  async create(userId: number, data: CreateCartItemBodyType) {
    const variant = await this.verifyVariantAndQuantity(data.variantId, data.quantity)
    const existingCartItem = await this.cartRepo.findUnique({ userId_variantId: { userId, variantId: data.variantId } })
    if (existingCartItem) {
      if (existingCartItem.quantity + data.quantity > variant.stock) {
        throw new ConflictException('Out of stock for variant')
      }
    }
    return await this.cartRepo.create(userId, data)
  }

  async update(userId: number, cartItemId: number, data: CreateCartItemBodyType) {
    await this.verifyCartItemExists(cartItemId)
    await this.verifyVariantAndQuantity(data.variantId, data.quantity)
    await this.cartRepo.update({ where: { id: cartItemId, userId }, data })
    return { message: 'Cart item updated successfully' }
  }

  async delete(userId: number, data: DeleteCartItemsBodyType) {
    try {
      await this.cartRepo.delete(userId, data)
      return { message: 'Cart item deleted successfully' }
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException(`Cart item not found`)
      }
      throw error
    }
  }
}
