import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { PermissionRepo } from './permission.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { CreatePermissionBodyType, UpdatePermissionBodyType } from './permission.model'
import { isUniquePrismaError } from 'src/shared/helpers'

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepo: PermissionRepo) {}

  private async verifyPermissionExists({ permissionId }: { permissionId: number }) {
    const permission = await this.permissionRepo.findUnique({ id: permissionId, deletedAt: null })
    if (!permission) {
      throw new NotFoundException('Permission not found')
    }
    return permission
  }

  async list(query: PaginationQueryType) {
    return await this.permissionRepo.list({ where: { deletedAt: null }, query })
  }

  async findAll() {
    return await this.permissionRepo.findAll({ deletedAt: null })
  }

  async findDetail(permissionId: number) {
    return await this.verifyPermissionExists({ permissionId })
  }

  async create(data: CreatePermissionBodyType) {
    try {
      const permission = await this.permissionRepo.create(data)
      return permission
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Permission with method and path already exists',
          path: 'method'
        })
      }
      throw error
    }
  }

  async update({ permissionId, data }: { permissionId: number; data: UpdatePermissionBodyType }) {
    const { id } = await this.verifyPermissionExists({ permissionId })
    try {
      const permission = await this.permissionRepo.update({ where: { id }, data })
      return permission
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Permission with method and path already exists',
          path: 'method'
        })
      }
      throw error
    }
  }

  async delete(permissionId: number) {
    const { id } = await this.verifyPermissionExists({ permissionId })
    await this.permissionRepo.delete({ id })
    return { message: 'Permission deleted successfully' }
  }
}
