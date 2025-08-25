import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { CANCEL_ORDER_JOB_NAME, ORDER_QUEUE_NAME } from 'src/shared/constants/queue.constant'
import { SharedOrderRepo } from 'src/shared/repositories/shared-order.repo'

@Processor(ORDER_QUEUE_NAME)
export class OrderConsumer extends WorkerHost {
  constructor(private readonly sharedOrderRepo: SharedOrderRepo) {
    super()
  }

  async process(job: Job<{ orderId: number }, any, string>): Promise<any> {
    switch (job.name) {
      case CANCEL_ORDER_JOB_NAME: {
        const { orderId } = job.data
        await this.sharedOrderRepo.cancelOrderAndPayment({ id: orderId })
        return {}
      }
      default: {
        break
      }
    }
  }
}
