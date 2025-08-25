import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common'
import { PaymentService } from './payment.service'
import { Public } from 'src/shared/decorators/auth.decorator'
import {
  MomoPaymentCallbackQueryDTO,
  GetPaymentLinkBodyDTO,
  GetPaymentLinkResDTO,
  VNPayPaymentCallbackQueryDTO,
  CreateDineInPaymentBodyDTO,
  CreateDineInPaymentResDTO,
  CompleteDineInOrderBodyDTO,
  CompleteDineInOrderResDTO
} from './payment.dto'
import { Response } from 'express'
import envConfig from 'src/shared/config'
import { ZodSerializerDto } from 'nestjs-zod'
import { Room } from 'src/shared/constants/websocket.constant'
import { PaymentStatus } from 'src/shared/constants/payment.constant'
import { OrderGateway } from 'src/websockets/order.gateway'

@Controller('payment')
@Public()
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly orderGateway: OrderGateway
  ) {}

  @Post('create-link')
  @ZodSerializerDto(GetPaymentLinkResDTO)
  createLink(@Body() body: GetPaymentLinkBodyDTO) {
    return this.paymentService.createLink(body)
  }

  @Get('vnpay/callback')
  async vnpayPaymentCallback(@Query() query: VNPayPaymentCallbackQueryDTO, @Res() res: Response) {
    const { orderId, status } = await this.paymentService.handleVNPayCallback(query)
    this.orderGateway.server.to(Room.Manage).emit('changed-order-status', {
      message: `Payment ${status === PaymentStatus.Succeeded ? 'confirmed' : 'failed'} for order #${orderId}`
    })
    return res.redirect(`${envConfig.CLIENT_REDIRECT_URI}/payment-callback?status=${status}&orderId=${orderId}`)
  }

  @Get('momo/callback')
  async momoPaymentCallback(@Query() query: MomoPaymentCallbackQueryDTO, @Res() res: Response) {
    const { orderId, status } = await this.paymentService.handleMomoCallback(query)
    this.orderGateway.server.to(Room.Manage).emit('changed-order-status', {
      message: `Payment ${status === PaymentStatus.Succeeded ? 'confirmed' : 'failed'} for order #${orderId}`
    })
    return res.redirect(`${envConfig.CLIENT_REDIRECT_URI}/payment-callback?status=${status}&orderId=${orderId}`)
  }

  @Post('dine-in/create')
  @ZodSerializerDto(CreateDineInPaymentResDTO)
  createDineInPayment(@Body() body: CreateDineInPaymentBodyDTO) {
    return this.paymentService.createDineInPayment(body)
  }

  @Post('dine-in/complete')
  @ZodSerializerDto(CompleteDineInOrderResDTO)
  completeDineInOrder(@Body() body: CompleteDineInOrderBodyDTO) {
    return this.paymentService.completeDineInOrder(body)
  }
}
