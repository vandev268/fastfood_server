import { Module } from '@nestjs/common'
import { ReservationController } from './reservation.controller'
import { ReservationService } from './reservation.service'
import { ReservationRepo } from './reservation.repo'

@Module({
  controllers: [ReservationController],
  providers: [ReservationService, ReservationRepo]
})
export class ReservationModule {}
