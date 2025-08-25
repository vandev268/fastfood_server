import { Injectable, NotFoundException, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common'
import { RoleRepo } from './role.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { ChangeRoleStatusBodyType, CreateRoleBodyType, UpdateRoleBodyType } from './role.model'
import { isNotFoundPrismaError, isUniquePrismaError } from 'src/shared/helpers'
import { SharedRoleRepo } from 'src/shared/repositories/shared-role.repo'
import { UserDetailType } from 'src/shared/models/shared-user.model'

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepo: RoleRepo,
    private readonly sharedRoleRepo: SharedRoleRepo
  ) {}

  private async verifyRoleExists({ roleId }: { roleId: number }) {
    const role = await this.sharedRoleRepo.findUnique({ id: roleId, deletedAt: null })
    if (!role) {
      throw new NotFoundException('Role not found')
    }
    return role
  }

  private async verifyHandler(handler: UserDetailType, roleId?: number) {
    const adminRoleId = await this.sharedRoleRepo.getAdminRoleId()
    if (handler.role.id !== adminRoleId) {
      throw new UnauthorizedException('You do not have permission to perform this action')
    }
    if (roleId && roleId === adminRoleId) {
      throw new UnauthorizedException('You cannot modify the admin role')
    }
    return true
  }

  async list({ handler, query }: { handler: UserDetailType; query: PaginationQueryType }) {
    await this.verifyHandler(handler)
    return this.roleRepo.list({ where: { deletedAt: null }, query })
  }

  async findAll({ handler }: { handler: UserDetailType }) {
    await this.verifyHandler(handler)
    return this.roleRepo.findAll({ deletedAt: null })
  }

  async findDetail({ handler, roleId }: { handler: UserDetailType; roleId: number }) {
    await this.verifyHandler(handler)
    const role = await this.roleRepo.findDetail({ id: roleId })
    if (!role) {
      throw new NotFoundException('Role not found')
    }
    return role
  }

  async create({ handler, data }: { handler: UserDetailType; data: CreateRoleBodyType }) {
    await this.verifyHandler(handler)
    try {
      const role = await this.roleRepo.create(data)
      return role
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Role with this name already exists',
          path: 'name'
        })
      }
      throw error
    }
  }

  async update({ handler, roleId, data }: { handler: UserDetailType; roleId: number; data: UpdateRoleBodyType }) {
    await this.verifyHandler(handler, roleId)
    const { id } = await this.verifyRoleExists({ roleId })
    try {
      const role = await this.roleRepo.update({ where: { id }, data })
      return role
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Permissions not exist',
          path: 'permissionIds'
        })
      }
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Role with this name already exists',
          path: 'name'
        })
      }
      throw error
    }
  }

  async changeStatus({
    handler,
    roleId,
    data
  }: {
    handler: UserDetailType
    roleId: number
    data: ChangeRoleStatusBodyType
  }) {
    await this.verifyHandler(handler, roleId)
    const { id } = await this.verifyRoleExists({ roleId })
    await this.roleRepo.changeStatus({ where: { id }, data })
    return { message: 'Role status updated successfully' }
  }

  async delete({ handler, roleId }: { handler: UserDetailType; roleId: number }) {
    await this.verifyHandler(handler, roleId)
    const { id } = await this.verifyRoleExists({ roleId })
    await this.roleRepo.delete({ id })
    return { message: 'Role deleted successfully' }
  }
}
