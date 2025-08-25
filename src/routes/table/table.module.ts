import { Module } from '@nestjs/common'
import { TableController } from './table.controller'
import { TableService } from './table.service'
import { TableRepo } from './table.repo'

@Module({
  controllers: [TableController],
  providers: [TableService, TableRepo]
})
export class TableModule {}
