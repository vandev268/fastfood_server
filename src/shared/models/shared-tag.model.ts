import { z } from 'zod'
import { TagType } from '../constants/tag.constant'

export const TagSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(500),
  type: z.nativeEnum(TagType),
  description: z.string().default(''),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type TagType = z.infer<typeof TagSchema>
