import { Injectable } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { Prisma } from '@prisma/client'
import envConfig from '../config'
import { SharedRoleRepo } from './shared-role.repo'

@Injectable()
export class SharedUserRepo {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly sharedRoleRepo: SharedRoleRepo
  ) {}

  async findFirst(where: Prisma.UserWhereInput) {
    return await this.prismaService.user.findFirst({
      where
    })
  }

  async findFirstWithRole(where: Prisma.UserWhereInput) {
    return await this.prismaService.user.findFirst({
      where,
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
  }

  async findUnique(where: Prisma.UserWhereUniqueInput) {
    return await this.prismaService.user.findUnique({
      where
    })
  }

  async findUniqueWithRole(where: Prisma.UserWhereUniqueInput) {
    return await this.prismaService.user.findUnique({
      where,
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
  }

  async findDetail(where: Prisma.UserWhereInput) {
    return await this.prismaService.user.findFirst({
      where,
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

  async getBaseUser() {
    const user = await this.findFirst({
      email: envConfig.EMAIL_CLIENT_INIT,
      deletedAt: null
    })
    if (!user) {
      const adminRole = await this.sharedRoleRepo.getAdminRoleId()
      return await this.prismaService.user.create({
        data: {
          email: envConfig.EMAIL_CLIENT_INIT,
          name: 'Client',
          password: envConfig.PASSWORD_CLIENT_INIT,
          roleId: adminRole
        }
      })
    }
    return user
  }

  async changePassword({ where, password }: { where: Prisma.UserWhereUniqueInput; password: string }) {
    return await this.prismaService.user.update({
      where,
      data: { password }
    })
  }
}
