import { z } from 'zod'

export const ProvinceSchema = z.object({
  id: z.number(),
  name: z.string().max(500),
  nameEn: z.string().max(500),
  latitude: z.string().max(50),
  longitude: z.string().max(50)
})

export type ProvinceType = z.infer<typeof ProvinceSchema>
