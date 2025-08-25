import { z } from 'zod'
import { PermissionSchema } from 'src/shared/models/shared-permission.model'
import { RoleSchema } from 'src/shared/models/shared-role.model'

export const RoleDetailSchema = RoleSchema.extend({
  permissions: z.array(PermissionSchema)
})

export const RoleParamsSchema = z
  .object({
    roleId: z.coerce.number().int().positive()
  })
  .strict()

export const GetRolesResSchema = z.object({
  data: z.array(RoleSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllRolesResSchema = GetRolesResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateRoleBodySchema = RoleSchema.pick({
  name: true,
  description: true,
  isActive: true
}).strict()

export const UpdateRoleBodySchema = CreateRoleBodySchema.extend({
  permissionIds: z.array(z.number())
}).strict()

export const ChangeRoleStatusBodySchema = RoleSchema.pick({
  isActive: true
}).strict()

export type RoleParamsType = z.infer<typeof RoleParamsSchema>
export type RoleDetailType = z.infer<typeof RoleDetailSchema>
export type GetRolesResType = z.infer<typeof GetRolesResSchema>
export type GetAllRolesResType = z.infer<typeof GetAllRolesResSchema>
export type CreateRoleBodyType = z.infer<typeof CreateRoleBodySchema>
export type UpdateRoleBodyType = z.infer<typeof UpdateRoleBodySchema>
export type ChangeRoleStatusBodyType = z.infer<typeof ChangeRoleStatusBodySchema>
