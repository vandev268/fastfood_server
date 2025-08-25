import { Module } from '@nestjs/common'
import { OrderController } from './order.controller'
import { OrderService } from './order.service'
import { OrderRepo } from './order.repo'

@Module({
  controllers: [OrderController],
  providers: [OrderService, OrderRepo]
})
export class OrderModule {}
