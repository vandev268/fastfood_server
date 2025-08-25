import { z } from 'zod'
import { UserSchema } from './shared-user.model'
import { TableSchema } from './shared-table.model'
import { ReservationStatus } from '../constants/reservation.constant'

export const ReservationSchema = z.object({
  id: z.number(),
  tableId: z.coerce.number(),
  guestName: z.string().min(1).max(500),
  guestPhone: z.string().min(1).max(50),
  numberOfGuest: z.number().int().positive(),
  reservationTime: z.coerce.date(),
  status: z.nativeEnum(ReservationStatus).default(ReservationStatus.Pending),
  note: z.string().default(''),
  userId: z.coerce.number().nullable(),
  deletedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const ReservationDetailSchema = ReservationSchema.extend({
  table: TableSchema.pick({
    id: true,
    code: true,
    capacity: true,
    status: true,
    location: true
  }),
  user: UserSchema.pick({
    id: true,
    name: true,
    email: true,
    phoneNumber: true,
    avatar: true
  }).nullable()
})

export type ReservationType = z.infer<typeof ReservationSchema>
export type ReservationDetailType = z.infer<typeof ReservationDetailSchema>
