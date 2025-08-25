import { Module } from '@nestjs/common'
import { TagController } from './tag.controller'
import { TagService } from './tag.service'
import { TagRepo } from './tag.repo'

@Module({
  controllers: [TagController],
  providers: [TagService, TagRepo]
})
export class TagModule {}
