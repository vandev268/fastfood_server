import { Module } from '@nestjs/common'
import { PaymentController } from './payment.controller'
import { PaymentService } from './payment.service'
import { PaymentRepo } from './payment.repo'
import { BullModule } from '@nestjs/bullmq'
import { ORDER_QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { PaymentProducer } from './payment.producer'

@Module({
  imports: [
    BullModule.registerQueue({
      name: ORDER_QUEUE_NAME
    })
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepo, PaymentProducer]
})
export class PaymentModule {}
