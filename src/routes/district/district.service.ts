import { Injectable, NotFoundException } from '@nestjs/common'
import { DistrictRepo } from './district.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'

@Injectable()
export class DistrictService {
  constructor(private readonly districtRepo: DistrictRepo) {}

  async list(query: PaginationQueryType) {
    return await this.districtRepo.list(query)
  }

  async findAll() {
    return await this.districtRepo.findAll()
  }

  async findDetail(districtId: number) {
    const district = await this.districtRepo.findDetail(districtId)
    if (!district) {
      throw new NotFoundException(`District not found`)
    }
    return district
  }
}
