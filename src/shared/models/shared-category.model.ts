import { z } from 'zod'

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(500),
  thumbnail: z.string().nullable(),
  parentCategoryId: z.number().nullable(),
  description: z.string().default(''),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type CategoryType = z.infer<typeof CategorySchema>
