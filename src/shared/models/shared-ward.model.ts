import { z } from 'zod'

export const WardSchema = z.object({
  id: z.number(),
  name: z.string().max(500),
  nameEn: z.string().max(500),
  latitude: z.string().max(50),
  longitude: z.string().max(50),
  districtId: z.number()
})

export type WardType = z.infer<typeof WardSchema>
