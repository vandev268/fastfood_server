import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CreateReviewBodyType, GetReviewsQueryType, UpdateReviewBodyType } from './review.model'
import { Prisma } from '@prisma/client'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'

@Injectable()
export class ReviewRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list(query: GetReviewsQueryType) {
    const { productId } = query
    const [reviews, totalItems] = await Promise.all([
      this.prismaService.review.findMany({
        where: { productId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          }
        }
      }),
      this.prismaService.review.count({
        where: { productId, deletedAt: null }
      })
    ])

    return {
      data: reviews,
      totalItems
    }
  }

  async findUnique(where: Prisma.ReviewWhereUniqueInput) {
    return await this.prismaService.review.findUnique({
      where
    })
  }

  async findDetail(where: Prisma.ReviewWhereInput) {
    return await this.prismaService.review.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    })
  }

  async create({ userId, data }: { userId: number; data: CreateReviewBodyType }) {
    return await this.prismaService.review.create({
      data: {
        ...data,
        userId
      }
    })
  }

  async update({ where, data }: { where: Prisma.ReviewWhereUniqueInput; data: UpdateReviewBodyType }) {
    return await this.prismaService.review.update({
      where,
      data: {
        ...data,
        isEdited: true
      }
    })
  }

  async delete(where: Prisma.ReviewWhereUniqueInput) {
    if (envConfig.DELETE_MODE === DeleteMode) {
      return await this.prismaService.review.update({
        where,
        data: { deletedAt: new Date() }
      })
    }
    return await this.prismaService.review.delete({
      where
    })
  }
}
