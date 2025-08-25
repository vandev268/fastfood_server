import { createZodDto } from 'nestjs-zod'
import { UserDetailSchema, UserSchema } from 'src/shared/models/shared-user.model'
import {
  ChangeUserPasswordBodySchema,
  ChangeUserStatusBodySchema,
  CreateUserBodySchema,
  GetAllUsersResSchema,
  GetUsersResSchema,
  UpdateUserBodySchema,
  UserParamsSchema
} from './user.model'

export class UserResDTO extends createZodDto(UserSchema) {}
export class UserDetailResDTO extends createZodDto(UserDetailSchema) {}
export class UserParamsDTO extends createZodDto(UserParamsSchema) {}
export class GetUsersResDTO extends createZodDto(GetUsersResSchema) {}
export class GetAllUsersResDTO extends createZodDto(GetAllUsersResSchema) {}
export class CreateUserBodyDTO extends createZodDto(CreateUserBodySchema) {}
export class UpdateUserBodyDTO extends createZodDto(UpdateUserBodySchema) {}
export class ChangeUserPasswordBodyDTO extends createZodDto(ChangeUserPasswordBodySchema) {}
export class ChangeUserStatusBodyDTO extends createZodDto(ChangeUserStatusBodySchema) {}
