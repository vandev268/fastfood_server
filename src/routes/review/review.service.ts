import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { ReviewRepo } from './review.repo'
import {
  CreateReviewBodyType,
  GetReviewDetailQueryType,
  GetReviewsQueryType,
  UpdateReviewBodyType
} from './review.model'
import { isUniquePrismaError } from 'src/shared/helpers'

@Injectable()
export class ReviewService {
  constructor(private readonly reviewRepo: ReviewRepo) {}

  async verifyReviewExists({ reviewId }: { reviewId: number }) {
    const review = await this.reviewRepo.findUnique({ id: reviewId, deletedAt: null })
    if (!review) {
      throw new NotFoundException('Review not found')
    }
    return review
  }

  async list(query: GetReviewsQueryType) {
    return await this.reviewRepo.list(query)
  }

  async findDetailByProductAndOrder(query: GetReviewDetailQueryType) {
    const { orderId, productId } = query
    const review = await this.reviewRepo.findDetail({ orderId, productId, deletedAt: null })
    if (!review) {
      throw new NotFoundException('Review not found')
    }
    return review
  }

  async findDetailById(reviewId: number) {
    const review = await this.reviewRepo.findDetail({ id: reviewId, deletedAt: null })
    if (!review) {
      throw new NotFoundException('Review not found')
    }
    return review
  }

  async create({ userId, data }: { userId: number; data: CreateReviewBodyType }) {
    try {
      return await this.reviewRepo.create({ data, userId })
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new ConflictException('You have already reviewed this product')
      }
      throw error
    }
  }

  async update({ reviewId, userId, data }: { reviewId: number; userId: number; data: UpdateReviewBodyType }) {
    const { id, isEdited } = await this.verifyReviewExists({ reviewId })
    if (isEdited) {
      throw new ConflictException('You already edited this review. You cannot edit it again')
    }
    return await this.reviewRepo.update({ where: { id, userId }, data })
  }

  async delete({ reviewId, userId }: { reviewId: number; userId: number }) {
    const { id } = await this.verifyReviewExists({ reviewId })
    await this.reviewRepo.delete({ id, userId })
    return { message: 'Review deleted successfully.' }
  }
}
