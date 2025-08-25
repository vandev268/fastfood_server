import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthRepo } from './auth.repo'
import { AuthController } from './auth.controller'

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRepo]
})
export class AuthModule {}
