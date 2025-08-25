import { z } from 'zod'
import { OrderSchema } from 'src/shared/models/shared-order.model'
import { TableSchema } from 'src/shared/models/shared-table.model'
import { ReservationSchema } from 'src/shared/models/shared-reservation.model'

export const TableDetailSchema = TableSchema.extend({
  reservations: z.array(ReservationSchema),
  orders: z.array(OrderSchema)
})

export const TableParamsSchema = z.object({
  tableId: z.coerce.number().int().positive()
})

export const GetTablesResSchema = z.object({
  data: z.array(TableDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllTablesResSchema = GetTablesResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateTableBodySchema = TableSchema.pick({
  code: true,
  capacity: true,
  status: true,
  location: true
}).strict()

export const UpdateTableBodySchema = CreateTableBodySchema

export const ChangeTableStatusBodySchema = TableSchema.pick({
  status: true
}).strict()

export type TableDetailType = z.infer<typeof TableDetailSchema>
export type TableParamsType = z.infer<typeof TableParamsSchema>
export type GetTablesResType = z.infer<typeof GetTablesResSchema>
export type GetAllTablesResType = z.infer<typeof GetAllTablesResSchema>
export type CreateTableBodyType = z.infer<typeof CreateTableBodySchema>
export type UpdateTableBodyType = z.infer<typeof UpdateTableBodySchema>
export type ChangeTableStatusBodyType = z.infer<typeof ChangeTableStatusBodySchema>
