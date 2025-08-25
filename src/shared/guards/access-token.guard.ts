import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { TokenService } from '../services/token.service'
import { HTTPMethod } from '../constants/http.constant'
import { PrismaService } from '../services/prisma.service'

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly prismaService: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const accessToken = request.headers['authorization']?.split(' ')[1]
    if (!accessToken) {
      return false
    }

    try {
      const decodedAccessToken = await this.tokenService.verifyAccessToken(accessToken)
      const path = request.route.path
      const method = String(request.method).toUpperCase() as keyof typeof HTTPMethod
      const roleWithPermissions = await this.prismaService.role.findUnique({
        where: {
          id: decodedAccessToken.roleId,
          isActive: true
        },
        include: {
          permissions: {
            where: {
              path,
              method
            }
          }
        }
      })
      if (!roleWithPermissions) {
        return false
      }

      if (roleWithPermissions.permissions.length > 0) {
        request['user'] = decodedAccessToken
        return true
      }
      return false
    } catch {
      throw new UnauthorizedException({
        name: 'EXPIRED_ACCESS_TOKEN',
        message: 'Access token has expired'
      })
    }
  }
}
