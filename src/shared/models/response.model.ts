import { z } from 'zod'

export const MessageResSchema = z.object({
  message: z.string()
})

export const PaginationResSchema = z.object({
  data: z.array(z.any()),
  metadata: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  })
})

export type MessageResType = z.infer<typeof MessageResSchema>
export type PaginationResType = z.infer<typeof PaginationResSchema>
