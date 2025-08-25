import { createZodDto } from 'nestjs-zod'
import {
  ChangeRoleStatusBodySchema,
  CreateRoleBodySchema,
  GetAllRolesResSchema,
  GetRolesResSchema,
  RoleDetailSchema,
  RoleParamsSchema,
  UpdateRoleBodySchema
} from './role.model'
import { RoleSchema } from 'src/shared/models/shared-role.model'

export class RoleResDTO extends createZodDto(RoleSchema) {}
export class RoleDetailResDTO extends createZodDto(RoleDetailSchema) {}
export class RoleParamsDTO extends createZodDto(RoleParamsSchema) {}
export class GetRolesResDTO extends createZodDto(GetRolesResSchema) {}
export class GetAllRolesResDTO extends createZodDto(GetAllRolesResSchema) {}
export class CreateRoleBodyDTO extends createZodDto(CreateRoleBodySchema) {}
export class UpdateRoleBodyDTO extends createZodDto(UpdateRoleBodySchema) {}
export class ChangeRoleStatusBodyDTO extends createZodDto(ChangeRoleStatusBodySchema) {}
