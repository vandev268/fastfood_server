import { createZodDto } from 'nestjs-zod'
import {
  ChangeOrderStatusBodySchema,
  CreateDeliveryOrderBodySchema,
  CreateDineInOrderBodySchema,
  CreateOnlineOrderBodySchema,
  CreateOrderResSchema,
  CreateTakeAwayOrderBodySchema,
  GetAllOrdersResSchema,
  GetOrdersResSchema,
  OrderParamsSchema,
  OrderQuerySchema
} from './order.model'
import { OrderDetailSchema, OrderSchema } from 'src/shared/models/shared-order.model'

export class OrderResDTO extends createZodDto(OrderSchema) {}
export class OrderDetailResDTO extends createZodDto(OrderDetailSchema) {}
export class OrderParamsDTO extends createZodDto(OrderParamsSchema) {}
export class OrderQueryDTO extends createZodDto(OrderQuerySchema) {}
export class GetOrdersResDTO extends createZodDto(GetOrdersResSchema) {}
export class GetAllOrdersResDTO extends createZodDto(GetAllOrdersResSchema) {}
export class CreateOnlineOrderBodyDTO extends createZodDto(CreateOnlineOrderBodySchema) {}
export class CreateTakeAwayOrderBodyDTO extends createZodDto(CreateTakeAwayOrderBodySchema) {}
export class CreateDeliveryOrderBodyDTO extends createZodDto(CreateDeliveryOrderBodySchema) {}
export class CreateDineInOrderBodyDTO extends createZodDto(CreateDineInOrderBodySchema) {}
export class CreateOrderResDTO extends createZodDto(CreateOrderResSchema) {}
export class ChangeOrderStatusBodyDTO extends createZodDto(ChangeOrderStatusBodySchema) {}
