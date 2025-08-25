import { createZodDto } from 'nestjs-zod'
import {
  DistrictParamsSchema,
  GetAllDistrictsResSchema,
  DistrictDetailSchema,
  GetDistrictsResSchema
} from './district.model'

export class DistrictDetailResDTO extends createZodDto(DistrictDetailSchema) {}
export class DistrictParamsDTO extends createZodDto(DistrictParamsSchema) {}
export class GetDistrictsResDTO extends createZodDto(GetDistrictsResSchema) {}
export class GetAllDistrictsResDTO extends createZodDto(GetAllDistrictsResSchema) {}
