import { Injectable, NotFoundException } from '@nestjs/common'
import { WardRepo } from './ward.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'

@Injectable()
export class WardService {
  constructor(private readonly wardRepo: WardRepo) {}

  async list(query: PaginationQueryType) {
    return await this.wardRepo.list(query)
  }

  async findAll() {
    return await this.wardRepo.findAll()
  }

  async findDetail(wardId: number) {
    const ward = await this.wardRepo.findDetail(wardId)
    if (!ward) {
      throw new NotFoundException(`Ward not found`)
    }
    return ward
  }
}
