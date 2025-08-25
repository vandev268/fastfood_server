import { z } from 'zod'
import { DistrictSchema } from 'src/shared/models/shared-district.model'
import { WardSchema } from 'src/shared/models/shared-ward.model'

export const DistrictDetailSchema = DistrictSchema.extend({
  wards: z.array(WardSchema)
})

export const DistrictParamsSchema = z
  .object({
    districtId: z.coerce.number().int().positive()
  })
  .strict()

export const GetDistrictsResSchema = z.object({
  data: z.array(DistrictSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllDistrictsResSchema = GetDistrictsResSchema.pick({
  data: true,
  totalItems: true
})

export type DistrictDetailType = z.infer<typeof DistrictDetailSchema>
export type DistrictParamsType = z.infer<typeof DistrictParamsSchema>
export type GetDistrictsResType = z.infer<typeof GetDistrictsResSchema>
export type GetAllDistrictsResType = z.infer<typeof GetAllDistrictsResSchema>
