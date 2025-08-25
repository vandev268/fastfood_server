import { z } from 'zod'
import { AddressDetailSchema, AddressSchema } from 'src/shared/models/shared-address.model'

export const AddressParamsSchema = z
  .object({
    addressId: z.coerce.number().int().positive()
  })
  .strict()

export const GetAddressesResSchema = z.object({
  data: z.array(AddressDetailSchema),
  totalItems: z.number(),
  limit: z.number(),
  page: z.number(),
  totalPages: z.number()
})

export const GetAllAddressesResSchema = GetAddressesResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateAddressBodySchema = AddressSchema.pick({
  recipientName: true,
  recipientPhone: true,
  provinceId: true,
  districtId: true,
  wardId: true,
  detailAddress: true,
  deliveryNote: true,
  isDefault: true
}).strict()

export const UpdateAddressBodySchema = CreateAddressBodySchema.strict()

export const ChangeAddressDefaultBodySchema = AddressSchema.pick({
  isDefault: true
}).strict()

export type AddressParamsType = z.infer<typeof AddressParamsSchema>
export type GetAddressesResType = z.infer<typeof GetAddressesResSchema>
export type GetAllAddressesResType = z.infer<typeof GetAllAddressesResSchema>
export type CreateAddressBodyType = z.infer<typeof CreateAddressBodySchema>
export type UpdateAddressBodyType = z.infer<typeof UpdateAddressBodySchema>
export type ChangeAddressDefaultBodyType = z.infer<typeof ChangeAddressDefaultBodySchema>
