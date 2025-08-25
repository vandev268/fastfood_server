import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ReviewService } from './review.service'
import {
  CreateReviewBodyDTO,
  GetReviewDetailQueryDTO,
  GetReviewsQueryDTO,
  GetReviewsResDTO,
  ReviewDetailResDTO,
  ReviewParamsDTO,
  ReviewResDTO,
  UpdateReviewBodyDTO
} from './review.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { UserActive } from 'src/shared/decorators/user-active.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('list')
  @ZodSerializerDto(GetReviewsResDTO)
  list(@Query() query: GetReviewsQueryDTO) {
    return this.reviewService.list(query)
  }

  @Get('')
  @ZodSerializerDto(ReviewDetailResDTO)
  findDetailByProductAndOrder(@Query() query: GetReviewDetailQueryDTO) {
    return this.reviewService.findDetailByProductAndOrder(query)
  }

  @Get(':reviewId')
  @ZodSerializerDto(ReviewDetailResDTO)
  findDetailById(@Param() params: ReviewParamsDTO) {
    return this.reviewService.findDetailById(params.reviewId)
  }

  @Post('')
  @ZodSerializerDto(ReviewResDTO)
  async create(@UserActive('id') userId: number, @Body() body: CreateReviewBodyDTO) {
    const result = await this.reviewService.create({ userId, data: body })
    return result
  }

  @Put(':reviewId')
  @ZodSerializerDto(ReviewResDTO)
  async update(@UserActive('id') userId: number, @Param() params: ReviewParamsDTO, @Body() body: UpdateReviewBodyDTO) {
    const result = await this.reviewService.update({ userId, reviewId: params.reviewId, data: body })
    return result
  }

  @Delete(':reviewId')
  @ZodSerializerDto(MessageResDTO)
  async delete(@UserActive('id') userId: number, @Param() params: ReviewParamsDTO) {
    const result = await this.reviewService.delete({ reviewId: params.reviewId, userId })
    return result
  }
}
