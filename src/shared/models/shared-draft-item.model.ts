import { z } from 'zod'
import { ProductSchema, VariantSchema } from './shared-product.model'
import { TableSchema } from './shared-table.model'
import { DraftItemStatus } from '../constants/draft-item.constant'

export const DraftItemSchema = z.object({
  id: z.number(),
  draftCode: z.string().max(500),
  status: z.nativeEnum(DraftItemStatus).default(DraftItemStatus.Pending),
  quantity: z.coerce.number().int().positive(),
  variantId: z.coerce.number(),
  createdAt: z.coerce.date()
})

export const DraftItemDetailSchema = DraftItemSchema.extend({
  variant: VariantSchema.extend({
    product: ProductSchema
  }),
  tables: z.array(TableSchema)
})

export const DraftItemWithTablesSchema = DraftItemSchema.extend({
  tables: z.array(TableSchema)
})

export type DraftItemType = z.infer<typeof DraftItemSchema>
export type DraftItemDetailType = z.infer<typeof DraftItemDetailSchema>
export type DraftItemWithTablesType = z.infer<typeof DraftItemWithTablesSchema>
