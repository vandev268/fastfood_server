import { createZodDto } from 'nestjs-zod'
import {
  GetAllProvincesResSchema,
  GetProvincesResSchema,
  ProvinceDetailSchema,
  ProvinceParamsSchema
} from './province.model'

export class ProvinceDetailResDTO extends createZodDto(ProvinceDetailSchema) {}
export class ProvinceParamsDTO extends createZodDto(ProvinceParamsSchema) {}
export class GetProvincesResDTO extends createZodDto(GetProvincesResSchema) {}
export class GetAllProvincesResDTO extends createZodDto(GetAllProvincesResSchema) {}
