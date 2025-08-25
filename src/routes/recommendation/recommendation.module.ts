import { Module } from '@nestjs/common'
import { RecommendationController } from './recommendation.controller'
import { PrismaService } from 'src/shared/services/prisma.service'
import { RecommendationService } from './recommendation.service'

@Module({
  controllers: [RecommendationController],
  providers: [RecommendationService, PrismaService]
})
export class RecommendationModule {}
