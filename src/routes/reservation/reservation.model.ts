import { ReservationDetailSchema, ReservationSchema } from 'src/shared/models/shared-reservation.model'
import { z } from 'zod'

export const ReservationParamsSchema = z.object({
  reservationId: z.coerce.number().int().positive()
})

export const GetReservationsResSchema = z.object({
  data: z.array(ReservationDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllReservationsResSchema = GetReservationsResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateReservationBodySchema = ReservationSchema.pick({
  guestName: true,
  guestPhone: true,
  numberOfGuest: true,
  reservationTime: true,
  status: true,
  note: true,
  tableId: true,
  userId: true
}).strict()

export const UpdateReservationBodySchema = CreateReservationBodySchema

export const ChangeReservationStatusBodySchema = ReservationSchema.pick({
  status: true
}).strict()

export type ReservationParamsType = z.infer<typeof ReservationParamsSchema>
export type GetReservationsResType = z.infer<typeof GetReservationsResSchema>
export type GetAllReservationsResType = z.infer<typeof GetAllReservationsResSchema>
export type CreateReservationBodyType = z.infer<typeof CreateReservationBodySchema>
export type UpdateReservationBodyType = z.infer<typeof UpdateReservationBodySchema>
export type ChangeReservationStatusBodyType = z.infer<typeof ChangeReservationStatusBodySchema>
