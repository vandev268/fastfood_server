import { Module } from '@nestjs/common'
import { OrderController } from './order.controller'
import { OrderService } from './order.service'
import { OrderRepo } from './order.repo'
import { BullModule } from '@nestjs/bullmq'
import { ORDER_QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { OrderProducer } from './order.producer'
import { DraftItemModule } from '../draft-item/draft-item.module'

@Module({
  imports: [
    BullModule.registerQueue({
      name: ORDER_QUEUE_NAME
    }),
    DraftItemModule
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepo, OrderProducer]
})
export class OrderModule {}
