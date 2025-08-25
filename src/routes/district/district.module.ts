import { Module } from '@nestjs/common'
import { DistrictController } from './district.controller'
import { DistrictService } from './district.service'
import { DistrictRepo } from './district.repo'

@Module({
  controllers: [DistrictController],
  providers: [DistrictService, DistrictRepo]
})
export class DistrictModule {}
