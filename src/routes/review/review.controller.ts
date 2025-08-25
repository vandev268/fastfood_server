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
import { ReviewGateway } from 'src/websockets/review.gateway'
import { Room } from 'src/shared/constants/websocket.constant'

@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly reviewGateway: ReviewGateway
  ) {}

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
    this.reviewGateway.server.to(Room.Review).emit('recieved-review', {
      message: 'Server received a new review'
    })
    return result
  }

  @Put(':reviewId')
  @ZodSerializerDto(ReviewResDTO)
  async update(@UserActive('id') userId: number, @Param() params: ReviewParamsDTO, @Body() body: UpdateReviewBodyDTO) {
    const result = await this.reviewService.update({ userId, reviewId: params.reviewId, data: body })
    this.reviewGateway.server.to(Room.Review).emit('recieved-review', {
      message: 'Server received an updated review'
    })
    return result
  }

  @Delete(':reviewId')
  @ZodSerializerDto(MessageResDTO)
  async delete(@UserActive('id') userId: number, @Param() params: ReviewParamsDTO) {
    const result = await this.reviewService.delete({ reviewId: params.reviewId, userId })
    this.reviewGateway.server.to(Room.Review).emit('recieved-review', {
      message: 'Server received a deleted review'
    })
    return result
  }
}
