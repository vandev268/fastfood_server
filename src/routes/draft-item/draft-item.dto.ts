import { createZodDto } from 'nestjs-zod'
import { DraftItemDetailSchema, DraftItemSchema } from 'src/shared/models/shared-draft-item.model'
import {
  AllDraftItemQuerySchema,
  ChangeDraftItemStatusBodySchema,
  ChangeDraftItemTablesBodySchema,
  CreateDraftItemBodySchema,
  DeleteDraftItemsBodySchema,
  DraftItemParamsSchema,
  DraftItemQuerySchema,
  GetAllDraftItemsResSchema,
  GetDraftItemsResSchema,
  UpdateDraftItemBodySchema
} from './draft-item.model'

export class DraftItemResDTO extends createZodDto(DraftItemSchema) {}
export class DraftItemDetailResDTO extends createZodDto(DraftItemDetailSchema) {}
export class DraftItemQueryDTO extends createZodDto(DraftItemQuerySchema) {}
export class AllDraftItemQueryDTO extends createZodDto(AllDraftItemQuerySchema) {}
export class DraftItemParamsDTO extends createZodDto(DraftItemParamsSchema) {}
export class GetDraftItemsResDTO extends createZodDto(GetDraftItemsResSchema) {}
export class GetAllDraftItemsResDTO extends createZodDto(GetAllDraftItemsResSchema) {}
export class CreateDraftItemBodyDTO extends createZodDto(CreateDraftItemBodySchema) {}
export class UpdateDraftItemBodyDTO extends createZodDto(UpdateDraftItemBodySchema) {}
export class ChangeDraftItemStatusBodyDTO extends createZodDto(ChangeDraftItemStatusBodySchema) {}
export class ChangeDraftItemTablesBodyDTO extends createZodDto(ChangeDraftItemTablesBodySchema) {}
export class DeleteDraftItemsBodyDTO extends createZodDto(DeleteDraftItemsBodySchema) {}
