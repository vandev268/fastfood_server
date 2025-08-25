import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { TagRepo } from './tag.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { CreateTagBodyType, UpdateTagBodyType } from './tag.model'
import { isUniquePrismaError } from 'src/shared/helpers'

@Injectable()
export class TagService {
  constructor(private readonly tagRepo: TagRepo) {}

  private async verifyTagExists({ tagId }: { tagId: number }) {
    const tag = await this.tagRepo.findUnique({ id: tagId, deletedAt: null })
    if (!tag) {
      throw new NotFoundException('Tag not found')
    }
    return tag
  }

  async list(query: PaginationQueryType) {
    return await this.tagRepo.list({ where: { deletedAt: null }, query })
  }

  async findAll() {
    return await this.tagRepo.findAll({ deletedAt: null })
  }

  async findDetail(tagId: number) {
    return await this.verifyTagExists({ tagId })
  }

  async create(data: CreateTagBodyType) {
    try {
      const tag = await this.tagRepo.create(data)
      return tag
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Tag with this name/type already exists',
          path: 'name'
        })
      }
      throw error
    }
  }

  async update({ tagId, data }: { tagId: number; data: UpdateTagBodyType }) {
    const { id } = await this.verifyTagExists({ tagId })
    try {
      const tag = await this.tagRepo.update({ where: { id }, data })
      return tag
    } catch (error) {
      if (isUniquePrismaError(error)) {
        throw new UnprocessableEntityException({
          message: 'Tag with this name/type already exists',
          path: 'name'
        })
      }
      throw error
    }
  }

  async delete(tagId: number) {
    const { id } = await this.verifyTagExists({ tagId })
    await this.tagRepo.delete({ id })
    return { message: 'Tag deleted successfully' }
  }
}
