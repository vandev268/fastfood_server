import { createZodDto } from 'nestjs-zod'
import {
  AddressParamsSchema,
  ChangeAddressDefaultBodySchema,
  CreateAddressBodySchema,
  GetAddressesResSchema,
  GetAllAddressesResSchema,
  UpdateAddressBodySchema
} from './address.model'
import { AddressDetailSchema, AddressSchema } from 'src/shared/models/shared-address.model'

export class AddressResDTO extends createZodDto(AddressSchema) {}
export class AddressDetailResDTO extends createZodDto(AddressDetailSchema) {}
export class AddressParamsDTO extends createZodDto(AddressParamsSchema) {}
export class GetAddressesResDTO extends createZodDto(GetAddressesResSchema) {}
export class GetAllAddressesResDTO extends createZodDto(GetAllAddressesResSchema) {}
export class CreateAddressBodyDTO extends createZodDto(CreateAddressBodySchema) {}
export class UpdateAddressBodyDTO extends createZodDto(UpdateAddressBodySchema) {}
export class ChangeAddressDefaultBodyDTO extends createZodDto(ChangeAddressDefaultBodySchema) {}
