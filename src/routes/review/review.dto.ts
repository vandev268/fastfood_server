import { createZodDto } from 'nestjs-zod'
import {
  CreateReviewBodySchema,
  GetReviewDetailQuerySchema,
  GetReviewsQuerySchema,
  GetReviewsResSchema,
  ReviewParamsScheme,
  UpdateReviewBodySchema
} from './review.model'
import { ReviewDetailSchema, ReviewSchema } from 'src/shared/models/shared-review.model'

export class ReviewResDTO extends createZodDto(ReviewSchema) {}
export class ReviewDetailResDTO extends createZodDto(ReviewDetailSchema) {}
export class GetReviewsQueryDTO extends createZodDto(GetReviewsQuerySchema) {}
export class GetReviewDetailQueryDTO extends createZodDto(GetReviewDetailQuerySchema) {}
export class GetReviewsResDTO extends createZodDto(GetReviewsResSchema) {}
export class ReviewParamsDTO extends createZodDto(ReviewParamsScheme) {}
export class CreateReviewBodyDTO extends createZodDto(CreateReviewBodySchema) {}
export class UpdateReviewBodyDTO extends createZodDto(UpdateReviewBodySchema) {}
