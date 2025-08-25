import { z } from 'zod'
import { ProvinceSchema } from './shared-province.model'
import { DistrictSchema } from './shared-district.model'
import { WardSchema } from './shared-ward.model'

export const AddressSchema = z.object({
  id: z.number(),
  userId: z.number(),
  recipientName: z.string().max(500),
  recipientPhone: z.string().max(50),
  provinceId: z.number(),
  districtId: z.number(),
  wardId: z.number(),
  detailAddress: z.string().max(1000),
  deliveryNote: z.string().max(1000).default(''),
  isDefault: z.boolean().default(false),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const AddressDetailSchema = AddressSchema.extend({
  province: ProvinceSchema,
  district: DistrictSchema,
  ward: WardSchema
})

export type AddressType = z.infer<typeof AddressSchema>
export type AddressDetailType = z.infer<typeof AddressDetailSchema>
