import { Global, Module } from '@nestjs/common'
import { ReviewGateway } from './review.gateway'
import { OrderGateway } from './order.gateway'
import { ProductGateway } from './product.gateway'
import { TagGateway } from './tag.gateway'
import { CategoryGateway } from './category.gateway'
import { TableGateway } from './table.gateway'
import { ReservationGateway } from './reservation.gateway'

const gateways = [
  ReviewGateway,
  OrderGateway,
  ProductGateway,
  TagGateway,
  CategoryGateway,
  TableGateway,
  ReservationGateway
]

@Global()
@Module({
  exports: [...gateways],
  providers: [...gateways]
})
export class WebsocketModule {}
