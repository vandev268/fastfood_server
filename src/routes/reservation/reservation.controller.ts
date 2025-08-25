import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { ReservationService } from './reservation.service'
import {
  ChangeReservationStatusBodyDTO,
  CreateReservationBodyDTO,
  GetAllReservationsResDTO,
  GetReservationsResDTO,
  ReservationDetailResDTO,
  ReservationParamsDTO,
  UpdateReservationBodyDTO
} from './reservation.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'
import { Public } from 'src/shared/decorators/auth.decorator'

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Get()
  @ZodSerializerDto(GetReservationsResDTO)
  list(@Query() query: PaginationQueryDTO) {
    return this.reservationService.list(query)
  }

  @Get('all')
  @ZodSerializerDto(GetAllReservationsResDTO)
  findAll() {
    return this.reservationService.findAll()
  }

  @Get(':reservationId')
  @ZodSerializerDto(ReservationDetailResDTO)
  findDetail(@Param() params: ReservationParamsDTO) {
    return this.reservationService.findDetail(params.reservationId)
  }

  @Post()
  @Public()
  @ZodSerializerDto(MessageResDTO)
  create(@Body() body: CreateReservationBodyDTO) {
    return this.reservationService.create(body)
  }

  @Put(':reservationId')
  @ZodSerializerDto(MessageResDTO)
  update(@Param() params: ReservationParamsDTO, @Body() body: UpdateReservationBodyDTO) {
    return this.reservationService.update({ reservationId: params.reservationId, data: body })
  }

  @Patch(':reservationId/change-status')
  @ZodSerializerDto(MessageResDTO)
  changeStatus(@Param() params: ReservationParamsDTO, @Body() body: ChangeReservationStatusBodyDTO) {
    return this.reservationService.changeStatus({ reservationId: params.reservationId, data: body })
  }
}
