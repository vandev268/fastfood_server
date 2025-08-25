import { Module } from '@nestjs/common'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { ProfileRepo } from './profile.repo'

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, ProfileRepo]
})
export class ProfileModule {}
