import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { ReservationRepo } from './reservation.repo'
import { PaginationQueryType } from 'src/shared/models/request.model'
import {
  ChangeReservationStatusBodyType,
  CreateReservationBodyType,
  UpdateReservationBodyType
} from './reservation.model'
import { SharedTableRepo } from 'src/shared/repositories/shared-table.repo'

@Injectable()
export class ReservationService {
  constructor(
    private readonly reservationRepo: ReservationRepo,
    private readonly sharedTableRepo: SharedTableRepo
  ) {}

  private async verifyReservationExists({ reservationId }: { reservationId: number }) {
    const reservation = await this.reservationRepo.findUnique({ id: reservationId, deletedAt: null })
    if (!reservation) {
      throw new NotFoundException('Reservation not found')
    }
    return reservation
  }

  async list(query: PaginationQueryType) {
    return await this.reservationRepo.list({ where: { deletedAt: null }, query })
  }

  async findAll() {
    return await this.reservationRepo.findAll({ deletedAt: null })
  }

  async findDetail(reservationId: number) {
    const reservation = await this.reservationRepo.findDetail({ id: reservationId, deletedAt: null })
    if (!reservation) {
      throw new NotFoundException('Reservation not found')
    }
    return reservation
  }

  async create(data: CreateReservationBodyType) {
    const table = await this.sharedTableRepo.findUnique({ id: data.tableId, deletedAt: null })
    if (!table) {
      throw new NotFoundException('Table not found')
    }
    const existingReservation = await this.reservationRepo.findExists({
      tableId: data.tableId,
      reservationTime: data.reservationTime,
      deletedAt: null
    })
    if (existingReservation) {
      throw new UnprocessableEntityException({
        message: 'Table is already reserved at this time',
        path: 'reservationTime'
      })
    }
    await this.reservationRepo.create(data)
    return { message: 'Reservation created successfully' }
  }

  async update({ reservationId, data }: { reservationId: number; data: UpdateReservationBodyType }) {
    const { id, tableId: oldTableId } = await this.verifyReservationExists({ reservationId })
    const table = await this.sharedTableRepo.findUnique({ id: data.tableId, deletedAt: null })
    if (!table) {
      throw new NotFoundException('Table not found')
    }
    const existingReservation = await this.reservationRepo.findExists({
      tableId: data.tableId,
      reservationTime: data.reservationTime,
      deletedAt: null
    })
    if (existingReservation && existingReservation.id !== id) {
      throw new UnprocessableEntityException({
        message: 'Table is already reserved at this time',
        path: 'reservationTime'
      })
    }
    await this.reservationRepo.update({ where: { id }, data, oldTableId })
    return { message: 'Reservation updated successfully' }
  }

  async changeStatus({ reservationId, data }: { reservationId: number; data: ChangeReservationStatusBodyType }) {
    const { id } = await this.verifyReservationExists({ reservationId })
    await this.reservationRepo.changeStatus({ where: { id }, data })
    return { message: 'Reservation status changed successfully' }
  }
}
