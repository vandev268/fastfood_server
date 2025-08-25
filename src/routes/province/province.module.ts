import { Module } from '@nestjs/common'
import { ProvinceController } from './province.controller'
import { ProvinceService } from './province.service'
import { ProvinceRepo } from './province.repo'

@Module({
  controllers: [ProvinceController],
  providers: [ProvinceService, ProvinceRepo]
})
export class ProvinceModule {}
