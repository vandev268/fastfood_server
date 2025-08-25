import { z } from 'zod'
import { UserStatus } from '../constants/user.constant'
import { RoleSchema } from './shared-role.model'

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email().max(500),
  password: z.string().min(3).max(500),
  roleId: z.coerce.number(),
  name: z.string().max(500).default(''),
  phoneNumber: z.string().max(50).default(''),
  avatar: z.string().max(1000).nullable(),
  dateOfBirth: z.coerce.date().nullable(),
  totpSecret: z.string().max(1000).nullable(),
  status: z.nativeEnum(UserStatus).default(UserStatus.Active),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const UserDetailSchema = UserSchema.omit({
  password: true,
  totpSecret: true
}).extend({
  role: RoleSchema.pick({
    id: true,
    name: true,
    isActive: true
  })
})

export type UserType = z.infer<typeof UserSchema>
export type UserDetailType = z.infer<typeof UserDetailSchema>
