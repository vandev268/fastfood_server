import { DistrictSchema } from 'src/shared/models/shared-district.model'
import { ProvinceSchema } from 'src/shared/models/shared-province.model'
import { z } from 'zod'

export const ProvinceDetailSchema = ProvinceSchema.extend({
  districts: z.array(DistrictSchema)
})

export const ProvinceParamsSchema = z
  .object({
    provinceId: z.coerce.number().int().positive()
  })
  .strict()

export const GetProvincesResSchema = z.object({
  data: z.array(ProvinceSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllProvincesResSchema = GetProvincesResSchema.pick({
  data: true,
  totalItems: true
})

export type ProvinceDetailType = z.infer<typeof ProvinceDetailSchema>
export type ProvinceParamsType = z.infer<typeof ProvinceParamsSchema>
export type GetProvincesResType = z.infer<typeof GetProvincesResSchema>
export type GetAllProvincesResType = z.infer<typeof GetAllProvincesResSchema>
