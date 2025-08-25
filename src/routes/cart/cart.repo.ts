import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CreateCartItemBodyType, DeleteCartItemsBodyType, UpdateCartItemBodyType } from './cart.model'
import { PaginationQueryType } from 'src/shared/models/request.model'

@Injectable()
export class CartRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list({ where, query }: { where: { userId: number }; query: PaginationQueryType }) {
    const { page, limit } = query
    const skip = (page - 1) * limit
    const [cartItems, totalItems] = await Promise.all([
      this.prismaService.cartItem.findMany({
        where,
        skip,
        take: limit,
        include: {
          variant: {
            include: {
              product: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prismaService.cartItem.count()
    ])

    return {
      data: cartItems,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: { userId: number }) {
    const cartItems = await this.prismaService.cartItem.findMany({
      where,
      include: {
        variant: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return {
      data: cartItems,
      totalItems: cartItems.length
    }
  }

  async findUnique(where: { id: number } | { userId_variantId: { userId: number; variantId: number } }) {
    return await this.prismaService.cartItem.findUnique({
      where
    })
  }

  async create(userId: number, data: CreateCartItemBodyType) {
    return await this.prismaService.cartItem.upsert({
      where: {
        userId_variantId: {
          userId,
          variantId: data.variantId
        }
      },
      create: {
        userId,
        variantId: data.variantId,
        quantity: data.quantity
      },
      update: {
        quantity: {
          increment: data.quantity
        }
      }
    })
  }

  async update({ where, data }: { where: { id: number; userId: number }; data: UpdateCartItemBodyType }) {
    return await this.prismaService.cartItem.update({
      where,
      data
    })
  }

  async delete(userId: number, data: DeleteCartItemsBodyType) {
    return await this.prismaService.cartItem.deleteMany({
      where: {
        id: {
          in: data.cartItemIds
        },
        userId
      }
    })
  }
}
