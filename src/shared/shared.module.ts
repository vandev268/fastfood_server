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
import { S3Service } from './services/s3.service'
import { SharedVariantRepo } from './repositories/shared-variant.repo'
import { SharedTableRepo } from './repositories/shared-table.repo'
import { SharedReservationRepo } from './repositories/shared-reservation.repo'
import { SharedDraftItemRepo } from './repositories/shared-draft-item.repo'

const sharedServices = [PrismaService, TokenService, UtilService, OtpService, S3Service]
const sharedRepositories = [
  SharedUserRepo,
  SharedRoleRepo,
  SharedVariantRepo,
  SharedTableRepo,
  SharedReservationRepo,
  SharedDraftItemRepo
]

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
