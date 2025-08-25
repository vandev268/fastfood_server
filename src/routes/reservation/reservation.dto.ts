import { createZodDto } from 'nestjs-zod'
import { ReservationDetailSchema, ReservationSchema } from 'src/shared/models/shared-reservation.model'
import {
  ChangeReservationStatusBodySchema,
  CreateReservationBodySchema,
  GetAllReservationsResSchema,
  GetReservationsResSchema,
  ReservationParamsSchema,
  UpdateReservationBodySchema
} from './reservation.model'

export class ReservationResDTO extends createZodDto(ReservationSchema) {}
export class ReservationDetailResDTO extends createZodDto(ReservationDetailSchema) {}
export class ReservationParamsDTO extends createZodDto(ReservationParamsSchema) {}
export class GetReservationsResDTO extends createZodDto(GetReservationsResSchema) {}
export class GetAllReservationsResDTO extends createZodDto(GetAllReservationsResSchema) {}
export class CreateReservationBodyDTO extends createZodDto(CreateReservationBodySchema) {}
export class UpdateReservationBodyDTO extends createZodDto(UpdateReservationBodySchema) {}
export class ChangeReservationStatusBodyDTO extends createZodDto(ChangeReservationStatusBodySchema) {}
