import { Injectable, NotFoundException } from '@nestjs/common'
import { ProvinceRepo } from './province.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'

@Injectable()
export class ProvinceService {
  constructor(private readonly provinceRepo: ProvinceRepo) {}

  async list(query: PaginationQueryType) {
    return await this.provinceRepo.list(query)
  }

  async findAll() {
    return await this.provinceRepo.findAll()
  }

  async findDetail(provinceId: number) {
    const province = await this.provinceRepo.findDetail(provinceId)
    if (!province) {
      throw new NotFoundException(`Province not found`)
    }
    return province
  }
}
