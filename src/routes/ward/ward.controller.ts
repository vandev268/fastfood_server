import { Controller, Get, Param, Query } from '@nestjs/common'
import { WardService } from './ward.service'
import { ZodSerializerDto } from 'nestjs-zod'
import { GetAllWardsResDTO, GetWardsResDTO, WardDetailResDTO, WardParamsDTO } from './ward.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'

@Controller('wards')
export class WardController {
  constructor(private readonly wardService: WardService) {}

  @Get()
  @ZodSerializerDto(GetWardsResDTO)
  list(@Query() query: PaginationQueryDTO) {
    return this.wardService.list(query)
  }

  @Get('all')
  @ZodSerializerDto(GetAllWardsResDTO)
  findAll() {
    return this.wardService.findAll()
  }

  @Get(':wardId')
  @ZodSerializerDto(WardDetailResDTO)
  findDetail(@Param() params: WardParamsDTO) {
    return this.wardService.findDetail(params.wardId)
  }
}
