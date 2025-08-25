import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'
import { ORDER_QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { generateCancelOrderJobId } from 'src/shared/helpers'

@Injectable()
export class PaymentProducer {
  constructor(@InjectQueue(ORDER_QUEUE_NAME) private paymentQueue: Queue) {
    this.paymentQueue
      .getJobs()
      .then((jobs) => {
        console.log(jobs)
      })
      .catch(() => {})
  }

  async removeCancelOrderJob(orderId: number) {
    return await this.paymentQueue.remove(generateCancelOrderJobId(orderId))
  }
}
