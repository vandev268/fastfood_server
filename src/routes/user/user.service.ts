import { Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { UserRepo } from './user.repo'
import { UtilService } from 'src/shared/services/util.service'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { isUniquePrismaError } from 'src/shared/helpers'
import {
  ChangeUserPasswordBodyType,
  ChangeUserStatusBodyType,
  CreateUserBodyType,
  UpdateUserBodyType
} from './user.model'
import { SharedUserRepo } from 'src/shared/repositories/shared-user.repo'
import { UserDetailType } from 'src/shared/models/shared-user.model'
import { SharedRoleRepo } from 'src/shared/repositories/shared-role.repo'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'
import { S3Service } from 'src/shared/services/s3.service'

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepo,
    private readonly sharedUserRepo: SharedUserRepo,
    private readonly sharedRoleRepo: SharedRoleRepo,
    private readonly utilService: UtilService,
    private readonly s3Service: S3Service
  ) {}

  private async verifyUserExists({ userId }: { userId: number }) {
    const user = await this.sharedUserRepo.findUnique({ id: userId, deletedAt: null })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  private async verifyHandler(handler: UserDetailType, roleId: number) {
    const adminRoleId = await this.sharedRoleRepo.getAdminRoleId()
    const managerRoleId = await this.sharedRoleRepo.getManagerRoleId()
    if ((roleId === adminRoleId || roleId === managerRoleId) && handler.roleId !== adminRoleId) {
      throw new UnauthorizedException('You do not have permission to assign this role')
    }
    return true
  }

  async list(query: PaginationQueryType) {
    return await this.userRepo.list({ where: { deletedAt: null }, query })
  }

  async findAll() {
    return await this.userRepo.findAll({ deletedAt: null })
  }

  async findDetail(userId: number) {
    const user = await this.sharedUserRepo.findDetail({ id: userId, deletedAt: null })
    if (!user) {
      throw new NotFoundException('User not found')
    }
    return user
  }

  async create({ handler, data }: { handler: UserDetailType; data: CreateUserBodyType }) {
    await this.verifyHandler(handler, data.roleId)
    try {
      const hashedPassword = await this.utilService.hash(data.password)
      const user = await this.userRepo.create({
        ...data,
        password: hashedPassword
      })
      return user
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Email already exists',
          path: 'email'
        })
      }
      throw error
    }
  }

  async update({ handler, userId, data }: { handler: UserDetailType; userId: number; data: UpdateUserBodyType }) {
    await this.verifyHandler(handler, data.roleId)
    const { id, avatar, roleId } = await this.verifyUserExists({ userId })
    await this.verifyHandler(handler, roleId)
    try {
      const user = await this.userRepo.update({ where: { id }, data })
      if (avatar && avatar !== user.avatar) {
        await this.s3Service.deleteFiles([avatar])
      }
      return user
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Email already exists',
          path: 'email'
        })
      }
      throw error
    }
  }

  async changePassword({
    handler,
    userId,
    data
  }: {
    handler: UserDetailType
    userId: number
    data: ChangeUserPasswordBodyType
  }) {
    const { id, roleId } = await this.verifyUserExists({ userId })
    await this.verifyHandler(handler, roleId)
    const hashedPassword = await this.utilService.hash(data.password)
    await this.sharedUserRepo.changePassword({ where: { id }, password: hashedPassword })
    return { message: 'Password changed successfully' }
  }

  async changeStatus({
    handler,
    userId,
    data
  }: {
    handler: UserDetailType
    userId: number
    data: ChangeUserStatusBodyType
  }) {
    const { id, roleId } = await this.verifyUserExists({ userId })
    await this.verifyHandler(handler, roleId)
    await this.userRepo.changeStatus({ where: { id }, data })
    return { message: 'User status updated successfully' }
  }

  async delete({ handler, userId }: { handler: UserDetailType; userId: number }) {
    const { id, roleId, avatar } = await this.verifyUserExists({ userId })
    await this.verifyHandler(handler, roleId)
    await this.userRepo.delete({ id })
    if (envConfig.DELETE_MODE !== DeleteMode && avatar) {
      await this.s3Service.deleteFiles([avatar])
    }
    return { message: 'User deleted successfully' }
  }
}
