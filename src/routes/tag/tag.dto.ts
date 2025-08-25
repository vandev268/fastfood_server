import { createZodDto } from 'nestjs-zod'
import {
  CreateTagBodySchema,
  GetAllTagsResSchema,
  GetTagsResSchema,
  TagDetailSchema,
  TagParamsSchema,
  UpdateTagBodySchema
} from './tag.model'
import { TagSchema } from 'src/shared/models/shared-tag.model'

export class TagResDTO extends createZodDto(TagSchema) {}
export class TagDetailResDTO extends createZodDto(TagDetailSchema) {}
export class TagParamsDTO extends createZodDto(TagParamsSchema) {}
export class GetTagsResDTO extends createZodDto(GetTagsResSchema) {}
export class GetAllTagsResDTO extends createZodDto(GetAllTagsResSchema) {}
export class CreateTagBodyDTO extends createZodDto(CreateTagBodySchema) {}
export class UpdateTagBodyDTO extends createZodDto(UpdateTagBodySchema) {}
