import { z } from 'zod'
import { DraftItemDetailSchema, DraftItemSchema } from 'src/shared/models/shared-draft-item.model'
import { PaginationQuerySchema } from 'src/shared/models/request.model'

export const DraftItemQuerySchema = PaginationQuerySchema.extend({
  draftCode: z.string().max(500).optional(),
  tableId: z.coerce.number().int().positive().optional()
})

export const AllDraftItemQuerySchema = DraftItemQuerySchema.pick({
  draftCode: true,
  tableId: true
})

export const DraftItemParamsSchema = z.object({
  draftItemId: z.coerce.number().int().positive()
})

export const GetDraftItemsResSchema = z.object({
  data: z.array(DraftItemDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllDraftItemsResSchema = GetDraftItemsResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateDraftItemBodySchema = DraftItemSchema.pick({
  draftCode: true,
  variantId: true,
  quantity: true
})
  .extend({
    tableIds: z.array(z.coerce.number().int().positive())
  })
  .strict()

export const UpdateDraftItemBodySchema = CreateDraftItemBodySchema

export const ChangeDraftItemStatusBodySchema = DraftItemSchema.pick({
  status: true
}).strict()

export const ChangeDraftItemTablesBodySchema = DraftItemSchema.pick({
  draftCode: true
})
  .extend({
    tableIds: z.array(z.coerce.number().int().positive())
  })
  .strict()

export const DeleteDraftItemsBodySchema = DraftItemSchema.pick({
  draftCode: true
}).strict()

export type DraftItemQueryType = z.infer<typeof DraftItemQuerySchema>
export type AllDraftItemQueryType = z.infer<typeof AllDraftItemQuerySchema>
export type DraftItemParamsType = z.infer<typeof DraftItemParamsSchema>
export type GetDraftItemsResType = z.infer<typeof GetDraftItemsResSchema>
export type GetAllDraftItemsResType = z.infer<typeof GetAllDraftItemsResSchema>
export type CreateDraftItemBodyType = z.infer<typeof CreateDraftItemBodySchema>
export type UpdateDraftItemBodyType = z.infer<typeof UpdateDraftItemBodySchema>
export type ChangeDraftItemStatusBodyType = z.infer<typeof ChangeDraftItemStatusBodySchema>
export type ChangeDraftItemTablesBodyType = z.infer<typeof ChangeDraftItemTablesBodySchema>
export type DeleteDraftItemsBodyType = z.infer<typeof DeleteDraftItemsBodySchema>
