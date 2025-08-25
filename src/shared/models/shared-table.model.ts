import { z } from 'zod'
import { TableLocation, TableStatus } from '../constants/table.constant'

export const TableSchema = z.object({
  id: z.number(),
  code: z.string().min(1).max(50),
  capacity: z.coerce.number().int().positive(),
  status: z.nativeEnum(TableStatus).default(TableStatus.Available),
  location: z.nativeEnum(TableLocation).default(TableLocation.Floor1),
  deletedAt: z.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export type TableType = z.infer<typeof TableSchema>
