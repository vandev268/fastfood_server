import { createZodDto } from 'nestjs-zod'
import { GetAllWardsResSchema, GetWardsResSchema, WardDetailSchema, WardParamsSchema } from './ward.model'

export class WardDetailResDTO extends createZodDto(WardDetailSchema) {}
export class WardParamsDTO extends createZodDto(WardParamsSchema) {}
export class GetWardsResDTO extends createZodDto(GetWardsResSchema) {}
export class GetAllWardsResDTO extends createZodDto(GetAllWardsResSchema) {}
