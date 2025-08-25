import { z } from 'zod'
import { PermissionSchema } from 'src/shared/models/shared-permission.model'

export const PermissionDetailSchema = PermissionSchema

export const PermissionParamsSchema = z
  .object({
    permissionId: z.coerce.number().int().positive()
  })
  .strict()

export const GetPermissionsResSchema = z.object({
  data: z.array(PermissionSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllPermissionsResSchema = GetPermissionsResSchema.pick({
  data: true,
  totalItems: true
})

export const CreatePermissionBodySchema = PermissionSchema.pick({
  name: true,
  path: true,
  method: true,
  module: true,
  description: true
}).strict()

export const UpdatePermissionBodySchema = CreatePermissionBodySchema

export type PermissionDetailType = z.infer<typeof PermissionDetailSchema>
export type PermissionParamsType = z.infer<typeof PermissionParamsSchema>
export type GetPermissionsResType = z.infer<typeof GetPermissionsResSchema>
export type GetAllPermissionsResType = z.infer<typeof GetAllPermissionsResSchema>
export type CreatePermissionBodyType = z.infer<typeof CreatePermissionBodySchema>
export type UpdatePermissionBodyType = z.infer<typeof UpdatePermissionBodySchema>
