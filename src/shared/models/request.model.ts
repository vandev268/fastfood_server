import { z } from 'zod'

export const PaginationQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(10)
  })
  .strict()

export type PaginationQueryType = z.infer<typeof PaginationQuerySchema>
