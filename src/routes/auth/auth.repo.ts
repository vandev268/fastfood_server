import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { CreateRefreshTokenType, CreateVerificationCodeType, FindVerificationCodeType } from './auth.model'
import { UserType } from 'src/shared/models/shared-user.model'

@Injectable()
export class AuthRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async findVerificationCode(where: FindVerificationCodeType) {
    return await this.prismaService.verificationCode.findUnique({
      where
    })
  }

  async createVerificationCode(data: CreateVerificationCodeType) {
    return await this.prismaService.verificationCode.upsert({
      where: {
        email_type: {
          email: data.email,
          type: data.type
        }
      },
      create: data,
      update: {
        code: data.code,
        expiresAt: data.expiresAt
      }
    })
  }

  async deleteVerificationCode(where: FindVerificationCodeType) {
    return await this.prismaService.verificationCode.delete({
      where
    })
  }

  async findRefreshToken(token: string) {
    return await this.prismaService.refreshToken.findUnique({
      where: {
        token
      }
    })
  }
  async findRefreshTokenWithUserRole(token: string) {
    return await this.prismaService.refreshToken.findUnique({
      where: {
        token
      },
      include: {
        user: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                isActive: true
              }
            }
          }
        }
      }
    })
  }

  async createRefreshToken(data: CreateRefreshTokenType) {
    return await this.prismaService.refreshToken.create({
      data
    })
  }

  async deleteRefreshToken(token: string) {
    return await this.prismaService.refreshToken.delete({
      where: {
        token
      }
    })
  }

  async createUser(data: Pick<UserType, 'roleId' | 'email' | 'password' | 'name' | 'phoneNumber'>) {
    return await this.prismaService.user.create({
      data,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      },
      omit: {
        password: true,
        totpSecret: true
      }
    })
  }
}
