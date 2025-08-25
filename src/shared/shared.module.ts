import { Global, Module } from '@nestjs/common'
import { PrismaService } from './services/prisma.service'
import { JwtModule } from '@nestjs/jwt'
import { TokenService } from './services/token.service'
import { UtilService } from './services/util.service'
import { SharedUserRepo } from './repositories/shared-user.repo'
import { OtpService } from './services/otp.service'
import { AccessTokenGuard } from './guards/access-token.guard'
import { APP_GUARD } from '@nestjs/core'
import { AuthenticationGuard } from './guards/authentication.guard'
import { SharedRoleRepo } from './repositories/shared-role.repo'

const sharedServices = [PrismaService, TokenService, UtilService, OtpService]
const sharedRepositories = [SharedUserRepo, SharedRoleRepo]

@Global()
@Module({
  imports: [JwtModule],
  exports: [...sharedServices, ...sharedRepositories],
  providers: [
    ...sharedServices,
    ...sharedRepositories,
    AccessTokenGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard
    }
  ]
})
export class SharedModule {}
