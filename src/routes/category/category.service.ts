import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { CategoryRepo } from './category.repo'
import { CreateCategoryBodyType, UpdateCategoryBodyType } from './category.model'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { S3Service } from 'src/shared/services/s3.service'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepo: CategoryRepo,
    private readonly s3Service: S3Service
  ) {}

  private async verifyCategoryExists({ categoryId }: { categoryId: number }) {
    const category = await this.categoryRepo.findUnique({ id: categoryId, deletedAt: null })
    if (!category) {
      throw new NotFoundException('Category not found')
    }
    return category
  }

  async list(query: PaginationQueryType) {
    return await this.categoryRepo.list({ where: { deletedAt: null }, query })
  }

  async findAll() {
    return await this.categoryRepo.findAll({ deletedAt: null })
  }

  async findDetail(categoryId: number) {
    const category = await this.categoryRepo.findDetail({ id: categoryId, deletedAt: null })
    if (!category) {
      throw new NotFoundException('Category not found')
    }
    return category
  }

  async create(data: CreateCategoryBodyType) {
    if (data.parentCategoryId) {
      await this.verifyCategoryExists({ categoryId: data.parentCategoryId })
    }
    return await this.categoryRepo.create(data)
  }

  async update({ categoryId, data }: { categoryId: number; data: UpdateCategoryBodyType }) {
    const { id, thumbnail } = await this.verifyCategoryExists({ categoryId })
    if (data.parentCategoryId) {
      if (data.parentCategoryId === categoryId) {
        throw new UnprocessableEntityException({
          message: 'A category cannot be its own parent',
          path: 'parentCategoryId'
        })
      }
      await this.verifyCategoryExists({ categoryId: data.parentCategoryId })
    }

    const category = await this.categoryRepo.update({ where: { id }, data })
    if (thumbnail && thumbnail !== category.thumbnail) {
      await this.s3Service.deleteFiles([thumbnail])
    }
    return category
  }

  async delete(categoryId: number) {
    const { id, thumbnail } = await this.verifyCategoryExists({ categoryId })
    await this.categoryRepo.delete({ id })
    if (envConfig.DELETE_MODE !== DeleteMode && thumbnail) {
      await this.s3Service.deleteFiles([thumbnail])
    }
    return {
      message: 'Category deleted successfully'
    }
  }
}
