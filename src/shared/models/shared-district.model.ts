import { z } from 'zod'

export const DistrictSchema = z.object({
  id: z.number(),
  name: z.string().max(500),
  nameEn: z.string().max(500),
  latitude: z.string().max(50),
  longitude: z.string().max(50),
  provinceId: z.number()
})

export type DistrictType = z.infer<typeof DistrictSchema>
