import { z } from 'zod'
import { WardSchema } from 'src/shared/models/shared-ward.model'

export const WardDetailSchema = WardSchema

export const WardParamsSchema = z
  .object({
    wardId: z.coerce.number().int().positive()
  })
  .strict()

export const GetWardsResSchema = z.object({
  data: z.array(WardSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllWardsResSchema = GetWardsResSchema.pick({
  data: true,
  totalItems: true
})

export type WardDetailType = z.infer<typeof WardDetailSchema>
export type WardParamsType = z.infer<typeof WardParamsSchema>
export type GetWardsResType = z.infer<typeof GetWardsResSchema>
export type GetAllWardsResType = z.infer<typeof GetAllWardsResSchema>
