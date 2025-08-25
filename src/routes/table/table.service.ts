import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { TableRepo } from './table.repo'
import { ChangeTableStatusBodyType, CreateTableBodyType, UpdateTableBodyType } from './table.model'
import { isUniquePrismaError } from 'src/shared/helpers'
import { PaginationQueryType } from 'src/shared/models/request.model'

@Injectable()
export class TableService {
  constructor(private readonly tableRepo: TableRepo) {}

  private async verifyTableExists({ tableId }: { tableId: number }) {
    const table = await this.tableRepo.findUnique({ id: tableId, deletedAt: null })
    if (!table) {
      throw new NotFoundException('Table not found')
    }
    return table
  }

  async list(query: PaginationQueryType) {
    return await this.tableRepo.list({ where: { deletedAt: null }, query })
  }

  async findAll() {
    return await this.tableRepo.findAll({ deletedAt: null })
  }

  async findDetail(tableId: number) {
    const table = await this.tableRepo.findDetail({ id: tableId, deletedAt: null })
    if (!table) {
      throw new NotFoundException('Table not found')
    }
    return table
  }

  async create(data: CreateTableBodyType) {
    try {
      const table = await this.tableRepo.create(data)
      return table
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Table code already exists',
          path: 'code'
        })
      }
      throw error
    }
  }

  async update({ tableId, data }: { tableId: number; data: UpdateTableBodyType }) {
    const { id } = await this.verifyTableExists({ tableId })
    try {
      const table = await this.tableRepo.update({ where: { id }, data })
      return table
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Table code already exists',
          path: 'code'
        })
      }
      throw error
    }
  }

  async changeStatus({ tableId, data }: { tableId: number; data: ChangeTableStatusBodyType }) {
    const { id } = await this.verifyTableExists({ tableId })
    await this.tableRepo.changeStatus({ where: { id }, data })
    return { message: 'Table status updated successfully' }
  }

  async delete(tableId: number) {
    const { id } = await this.verifyTableExists({ tableId })
    await this.tableRepo.delete({ id })
    return { message: 'Table deleted successfully' }
  }
}
