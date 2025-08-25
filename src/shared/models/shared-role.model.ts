import { z } from 'zod'

export const RoleSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(500),
  description: z.string().default(''),
  isActive: z.boolean().default(true),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type RoleType = z.infer<typeof RoleSchema>
