import { Module } from '@nestjs/common'
import { DraftItemController } from './draft-item.controller'
import { DraftItemService } from './draft-item.service'
import { DraftItemRepo } from './draft-item.repo'

@Module({
  controllers: [DraftItemController],
  providers: [DraftItemService, DraftItemRepo]
})
export class DraftItemModule {}
