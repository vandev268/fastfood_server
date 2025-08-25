import { z } from 'zod'
import { UserDetailSchema, UserSchema } from 'src/shared/models/shared-user.model'

export const UserParamsSchema = z.object({
  userId: z.coerce.number().int().positive()
})

export const GetUsersResSchema = z.object({
  data: z.array(UserDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllUsersResSchema = GetUsersResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateUserBodySchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
  phoneNumber: true,
  avatar: true,
  dateOfBirth: true,
  status: true,
  roleId: true
}).strict()

export const UpdateUserBodySchema = CreateUserBodySchema.omit({
  email: true,
  password: true
}).strict()

export const ChangeUserPasswordBodySchema = UserSchema.pick({
  password: true
}).strict()

export const ChangeUserStatusBodySchema = UserSchema.pick({
  status: true
}).strict()

export type UserParamsType = z.infer<typeof UserParamsSchema>
export type GetUsersResType = z.infer<typeof GetUsersResSchema>
export type GetAllUsersResType = z.infer<typeof GetAllUsersResSchema>
export type CreateUserBodyType = z.infer<typeof CreateUserBodySchema>
export type UpdateUserBodyType = z.infer<typeof UpdateUserBodySchema>
export type ChangeUserPasswordBodyType = z.infer<typeof ChangeUserPasswordBodySchema>
export type ChangeUserStatusBodyType = z.infer<typeof ChangeUserStatusBodySchema>
