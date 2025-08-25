import { Body, Controller, Get, Post, Query, Param } from '@nestjs/common'
import { UserDetailType } from 'src/shared/models/shared-user.model'
import { UserActive } from 'src/shared/decorators/user-active.decorator'
import { Public } from 'src/shared/decorators/auth.decorator'
import { RecommendationService } from './recommendation.service'
import {
  GetRecommendedProductsResDTO,
  GetUserBehaviorInsightsResDTO,
  GetUserBehaviorTrackingResDTO,
  RecommendationQueryDTO,
  UpsertTrackingBehaviorBodyDTO
} from './recommandation.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { ProductParamsDTO } from '../product/product.dto'

@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('behavior/insights')
  @ZodSerializerDto(GetUserBehaviorInsightsResDTO)
  getUserBehaviorInsights(@UserActive() user: UserDetailType) {
    return this.recommendationService.getUserBehaviorInsights(user.id)
  }

  @Post('behavior/tracking')
  @ZodSerializerDto(GetUserBehaviorTrackingResDTO)
  async trackingUserBehavior(@UserActive() user: UserDetailType, @Body() body: UpsertTrackingBehaviorBodyDTO) {
    await this.recommendationService.trackingUserBehavior(user.id, body)
    return {
      data: {
        userId: user.id,
        action: body.action,
        productId: body.productId,
        timestamp: new Date().toISOString()
      }
    }
  }

  @Get('products')
  @ZodSerializerDto(GetRecommendedProductsResDTO)
  getRecommendedProducts(@UserActive() user: UserDetailType, @Query() query: RecommendationQueryDTO) {
    return this.recommendationService.getRecommendedProducts(user.id, query)
  }

  @Get('products/trending')
  @Public()
  @ZodSerializerDto(GetRecommendedProductsResDTO)
  getTrendingProducts(@Query() query: RecommendationQueryDTO) {
    return this.recommendationService.getTrendingProducts(query)
  }

  @Get('products/most-viewed')
  @Public()
  @ZodSerializerDto(GetRecommendedProductsResDTO)
  async getMostViewedProducts(@Query() query: RecommendationQueryDTO) {
    const recommendations = await this.recommendationService.getMostViewedProducts(query)
    return {
      data: recommendations,
      totalItems: recommendations.length
    }
  }

  @Get('products/:productId/similar')
  @Public()
  @ZodSerializerDto(GetRecommendedProductsResDTO)
  async getSimilarProducts(@Param() params: ProductParamsDTO, @Query() query: RecommendationQueryDTO) {
    const recommendations = await this.recommendationService.getSimilarProducts({ productId: params.productId, query })
    return {
      data: recommendations,
      totalItems: recommendations.length
    }
  }
}
