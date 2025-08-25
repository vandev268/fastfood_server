import { createZodDto } from 'nestjs-zod'
import {
  GetRecommendedProductsResSchema,
  GetUserBehaviorInsightsResSchema,
  GetUserBehaviorTrackingResSchema,
  RecommendationQuerySchema
} from './recommendation.model'
import { UpsertTrackingBehaviorBodySchema } from 'src/shared/models/shared-recommendation.model'

export class RecommendationQueryDTO extends createZodDto(RecommendationQuerySchema) {}
export class UpsertTrackingBehaviorBodyDTO extends createZodDto(UpsertTrackingBehaviorBodySchema) {}
export class GetRecommendedProductsResDTO extends createZodDto(GetRecommendedProductsResSchema) {}
export class GetUserBehaviorInsightsResDTO extends createZodDto(GetUserBehaviorInsightsResSchema) {}
export class GetUserBehaviorTrackingResDTO extends createZodDto(GetUserBehaviorTrackingResSchema) {}
