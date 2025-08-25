import { createZodDto } from 'nestjs-zod'
import {
  ChangeProfilePasswordBodySchema,
  ProfileDetailSchema,
  ProfileSchema,
  UpdateProfileBodySchema
} from './profile.model'

export class ProfileResDTO extends createZodDto(ProfileSchema) {}
export class ProfileDetailResDTO extends createZodDto(ProfileDetailSchema) {}
export class UpdateProfileBodyDTO extends createZodDto(UpdateProfileBodySchema) {}
export class ChangeProfilePasswordBodyDTO extends createZodDto(ChangeProfilePasswordBodySchema) {}
