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

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

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
    return result
  }

  @Post('create-takeaway')
  @ZodSerializerDto(CreateOrderResDTO)
  async createTakeAwayOrder(@UserActive() user: UserDetailType, @Body() body: CreateTakeAwayOrderBodyDTO) {
    const result = await this.orderService.createTakeAwayOrder(user, body)
    return result
  }

  @Post('create-delivery')
  @ZodSerializerDto(CreateOrderResDTO)
  async createDeliveryOrder(@UserActive() user: UserDetailType, @Body() body: CreateDeliveryOrderBodyDTO) {
    const result = await this.orderService.createDeliveryOrder({ handler: user, data: body })
    return result
  }

  @Post('create-dinein')
  @ZodSerializerDto(CreateOrderResDTO)
  async createDineInOrder(@UserActive() user: UserDetailType, @Body() body: CreateDineInOrderBodyDTO) {
    const result = await this.orderService.createDineInOrder({ handler: user, data: body })
    return result
  }

  @Patch(':orderId/change-status')
  @ZodSerializerDto(MessageResDTO)
  async changeOrderStatus(
    @UserActive() user: UserDetailType,
    @Param() params: OrderParamsDTO,
    @Body() body: ChangeOrderStatusBodyDTO
  ) {
    const { message } = await this.orderService.changeOrderStatus({ user, orderId: params.orderId, data: body })
    return { message }
  }
}
