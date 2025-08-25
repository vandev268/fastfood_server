import { Module } from '@nestjs/common'
import { WardController } from './ward.controller'
import { WardService } from './ward.service'
import { WardRepo } from './ward.repo'

@Module({
  controllers: [WardController],
  providers: [WardService, WardRepo]
})
export class WardModule {}
