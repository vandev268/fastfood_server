import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../services/prisma.service'
import { Prisma } from '@prisma/client'
import { isNotFoundPrismaError } from '../helpers'
import { RoleName } from '../constants/role.constant'

@Injectable()
export class SharedRoleRepo {
  private adminRoleId: number | null = null
  private managerRoleId: number | null = null
  private employeeRoleId: number | null = null
  private clientRoleId: number | null = null
  private guestRoleId: number | null = null

  constructor(private readonly prismaService: PrismaService) {}

  private async findRoleIdByName(name: string) {
    try {
      const role = await this.prismaService.role.findFirstOrThrow({
        where: { name, deletedAt: null }
      })
      return role.id
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException(`Role not found`)
      }
      throw error
    }
  }

  async findUnique(where: Prisma.RoleWhereUniqueInput) {
    return this.prismaService.role.findUnique({
      where
    })
  }

  async getAdminRoleId() {
    if (this.adminRoleId) {
      return this.adminRoleId
    }
    this.adminRoleId = await this.findRoleIdByName(RoleName.Admin)
    return this.adminRoleId
  }

  async getManagerRoleId() {
    if (this.managerRoleId) {
      return this.managerRoleId
    }
    this.managerRoleId = await this.findRoleIdByName(RoleName.Manager)
    return this.managerRoleId
  }

  async getEmployeeRoleId() {
    if (this.employeeRoleId) {
      return this.employeeRoleId
    }
    this.employeeRoleId = await this.findRoleIdByName(RoleName.Employee)
    return this.employeeRoleId
  }

  async getClientRoleId() {
    if (this.clientRoleId) {
      return this.clientRoleId
    }
    this.clientRoleId = await this.findRoleIdByName(RoleName.Client)
    return this.clientRoleId
  }
}
