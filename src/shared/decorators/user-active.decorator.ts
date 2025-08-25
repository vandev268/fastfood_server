import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { TokenService } from '../services/token.service'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../services/prisma.service'
import { UserDetailType } from '../models/shared-user.model'

const tokenService = new TokenService(new JwtService())
const prismaService = new PrismaService()

export const UserActive = createParamDecorator(
  async (field: keyof UserDetailType | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    const accessToken = request.headers['authorization']?.split(' ')[1]
    if (!accessToken) {
      throw new UnauthorizedException('Access token is required')
    }

    try {
      const decodedAccessToken = await tokenService.verifyAccessToken(accessToken)
      const user = await prismaService.user.findUnique({
        where: {
          id: decodedAccessToken.userId
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              isActive: true
            }
          }
        }
      })
      if (!user) {
        throw new NotFoundException('User not found')
      }
      return field ? user[field] : user
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new UnauthorizedException()
    }
  }
)
