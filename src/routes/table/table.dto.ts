import { createZodDto } from 'nestjs-zod'
import {
  ChangeTableStatusBodySchema,
  CreateTableBodySchema,
  GetAllTablesResSchema,
  GetTablesResSchema,
  TableDetailSchema,
  TableParamsSchema,
  UpdateTableBodySchema
} from './table.model'
import { TableSchema } from 'src/shared/models/shared-table.model'

export class TableResDTO extends createZodDto(TableSchema) {}
export class TableDetailResDTO extends createZodDto(TableDetailSchema) {}
export class TableParamsDTO extends createZodDto(TableParamsSchema) {}
export class GetTablesResDTO extends createZodDto(GetTablesResSchema) {}
export class GetAllTablesResDTO extends createZodDto(GetAllTablesResSchema) {}
export class CreateTableBodyDTO extends createZodDto(CreateTableBodySchema) {}
export class UpdateTableBodyDTO extends createZodDto(UpdateTableBodySchema) {}
export class ChangeTableStatusBodyDTO extends createZodDto(ChangeTableStatusBodySchema) {}
