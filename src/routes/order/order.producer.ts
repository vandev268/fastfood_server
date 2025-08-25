import { InjectQueue } from '@nestjs/bullmq'
import { Injectable } from '@nestjs/common'
import { Queue } from 'bullmq'
import envConfig from 'src/shared/config'
import { CANCEL_ORDER_JOB_NAME, ORDER_QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { generateCancelOrderJobId } from 'src/shared/helpers'
import ms from 'ms'

@Injectable()
export class OrderProducer {
  constructor(@InjectQueue(ORDER_QUEUE_NAME) private orderQueue: Queue) {
    this.orderQueue
      .getJobs()
      .then((jobs) => {
        console.log(jobs)
      })
      .catch(() => {})
  }

  async addCancelOrderJob(orderId: number) {
    await this.orderQueue.add(
      CANCEL_ORDER_JOB_NAME,
      {
        orderId
      },
      {
        delay: ms(envConfig.ORDER_CANCEL_AFTER as ms.StringValue), // Delay:ms, 24 hours
        jobId: generateCancelOrderJobId(orderId),
        removeOnComplete: true,
        removeOnFail: true
      }
    )
  }
}
