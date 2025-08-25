import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  ChangeOrderStatusBodyDTO,
  CreateDeliveryOrderBodyDTO,
  CreateDineInOrderBodyDTO,
  CreateOnlineOrderBodyDTO,
  CreateOrderResDTO,
  CreateTakeAwayOrderBodyDTO,
  GetAllOrdersResDTO,
  GetOrdersResDTO,
  OrderDetailResDTO,
  OrderParamsDTO,
  OrderQueryDTO
} from './order.dto'
import { OrderService } from './order.service'
import { UserActive } from 'src/shared/decorators/user-active.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { UserDetailType } from 'src/shared/models/shared-user.model'
import { OrderGateway } from 'src/websockets/order.gateway'
import { Room } from 'src/shared/constants/websocket.constant'
import { generateRoomUserId } from 'src/shared/helpers'
import { TableGateway } from 'src/websockets/table.gateway'
import { ReservationGateway } from 'src/websockets/reservation.gateway'

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderGateway: OrderGateway,
    private readonly tableGateway: TableGateway,
    private readonly reservationGateway: ReservationGateway
  ) {}

  @Get()
  @ZodSerializerDto(GetOrdersResDTO)
  list(@Query() query: OrderQueryDTO) {
    return this.orderService.list(query)
  }

  @Get('all')
  @ZodSerializerDto(GetAllOrdersResDTO)
  findAll() {
    return this.orderService.findAll()
  }

  @Get(':orderId')
  @ZodSerializerDto(OrderDetailResDTO)
  findDetail(@Param() params: OrderParamsDTO) {
    return this.orderService.findDetail(params.orderId)
  }

  @Post('create-online')
  @ZodSerializerDto(CreateOrderResDTO)
  async createOnlineOrder(@UserActive() user: UserDetailType, @Body() body: CreateOnlineOrderBodyDTO) {
    const result = await this.orderService.createOnlineOrder(user, body)
    this.orderGateway.server.to(Room.Manage).emit('recieved-order', {
      message: 'New order created'
    })
    return result
  }

  @Post('create-takeaway')
  @ZodSerializerDto(CreateOrderResDTO)
  async createTakeAwayOrder(@UserActive() user: UserDetailType, @Body() body: CreateTakeAwayOrderBodyDTO) {
    const result = await this.orderService.createTakeAwayOrder(user, body)
    this.orderGateway.server.to(Room.Manage).emit('recieved-order', {
      message: 'New takeaway order created'
    })
    return result
  }

  @Post('create-delivery')
  @ZodSerializerDto(CreateOrderResDTO)
  async createDeliveryOrder(@UserActive() user: UserDetailType, @Body() body: CreateDeliveryOrderBodyDTO) {
    const result = await this.orderService.createDeliveryOrder({ handler: user, data: body })
    this.orderGateway.server.to(Room.Manage).emit('recieved-order', {
      message: 'New delivery order created'
    })
    return result
  }

  @Post('create-dinein')
  @ZodSerializerDto(CreateOrderResDTO)
  async createDineInOrder(@UserActive() user: UserDetailType, @Body() body: CreateDineInOrderBodyDTO) {
    const result = await this.orderService.createDineInOrder({ handler: user, data: body })
    this.tableGateway.server.to(Room.Table).emit('sended-table', {
      message: 'Table status changed'
    })
    this.orderGateway.server.to(Room.Manage).emit('recieved-order', {
      message: 'New dine-in order created'
    })
    this.reservationGateway.server.to(Room.Reservation).emit('changed-reservation-status', {
      message: 'Reservation status changed'
    })
    return result
  }

  @Patch(':orderId/change-status')
  @ZodSerializerDto(MessageResDTO)
  async changeOrderStatus(
    @UserActive() user: UserDetailType,
    @Param() params: OrderParamsDTO,
    @Body() body: ChangeOrderStatusBodyDTO
  ) {
    const { order, message } = await this.orderService.changeOrderStatus({ user, orderId: params.orderId, data: body })
    if (order.userId) {
      this.orderGateway.server.to(Room.Manage).to(generateRoomUserId(order.userId)).emit('changed-order-status', {
        message: 'Order status changed'
      })
    }
    return { message }
  }
}
