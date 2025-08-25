import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { UpdateProfileBodyType } from './profile.model'

@Injectable()
export class ProfileRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async update({ where, data }: { where: { id: number }; data: UpdateProfileBodyType }) {
    return await this.prismaService.user.update({
      where,
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

  async changePassword({ where, password }: { where: { id: number }; password: string }) {
    return await this.prismaService.user.update({
      where,
      data: {
        password
      }
    })
  }
}
