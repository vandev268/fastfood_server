import { createZodDto } from 'nestjs-zod'
import { PermissionSchema } from 'src/shared/models/shared-permission.model'
import {
  CreatePermissionBodySchema,
  GetAllPermissionsResSchema,
  GetPermissionsResSchema,
  PermissionDetailSchema,
  PermissionParamsSchema,
  UpdatePermissionBodySchema
} from './permission.model'

export class PermissionResDTO extends createZodDto(PermissionSchema) {}
export class PermissionDetailResDTO extends createZodDto(PermissionDetailSchema) {}
export class PermissionParamsDTO extends createZodDto(PermissionParamsSchema) {}
export class GetPermissionsResDTO extends createZodDto(GetPermissionsResSchema) {}
export class GetAllPermissionsResDTO extends createZodDto(GetAllPermissionsResSchema) {}
export class CreatePermissionBodyDTO extends createZodDto(CreatePermissionBodySchema) {}
export class UpdatePermissionBodyDTO extends createZodDto(UpdatePermissionBodySchema) {}
