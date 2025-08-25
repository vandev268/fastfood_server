import { Controller, Get, Param, Query } from '@nestjs/common'
import { DistrictService } from './district.service'
import { ZodSerializerDto } from 'nestjs-zod'
import { DistrictDetailResDTO, DistrictParamsDTO, GetAllDistrictsResDTO, GetDistrictsResDTO } from './district.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'

@Controller('districts')
export class DistrictController {
  constructor(private readonly districtService: DistrictService) {}

  @Get()
  @ZodSerializerDto(GetDistrictsResDTO)
  list(@Query() query: PaginationQueryDTO) {
    return this.districtService.list(query)
  }

  @Get('all')
  @ZodSerializerDto(GetAllDistrictsResDTO)
  findAll() {
    return this.districtService.findAll()
  }

  @Get(':districtId')
  @ZodSerializerDto(DistrictDetailResDTO)
  findDetail(@Param() params: DistrictParamsDTO) {
    return this.districtService.findDetail(params.districtId)
  }
}
