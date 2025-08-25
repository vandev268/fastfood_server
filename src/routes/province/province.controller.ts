import { Controller, Get, Param, Query } from '@nestjs/common'
import { ProvinceService } from './province.service'
import { ZodSerializerDto } from 'nestjs-zod'
import { GetAllProvincesResDTO, GetProvincesResDTO, ProvinceDetailResDTO, ProvinceParamsDTO } from './province.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'

@Controller('provinces')
export class ProvinceController {
  constructor(private readonly provinceService: ProvinceService) {}

  @Get()
  @ZodSerializerDto(GetProvincesResDTO)
  list(@Query() query: PaginationQueryDTO) {
    return this.provinceService.list(query)
  }

  @Get('all')
  @ZodSerializerDto(GetAllProvincesResDTO)
  findAll() {
    return this.provinceService.findAll()
  }

  @Get(':provinceId')
  @ZodSerializerDto(ProvinceDetailResDTO)
  findDetail(@Param() params: ProvinceParamsDTO) {
    return this.provinceService.findDetail(params.provinceId)
  }
}
