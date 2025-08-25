import { createZodDto } from 'nestjs-zod'
import {
  CategoryDataSchema,
  CustomerRatingSchema,
  DeliveryPerformanceSchema,
  OrderTypeDataSchema,
  OrderVolumeDataSchema,
  OverviewStatsSchema,
  PopularProductSchema,
  ProvinceDeliveryDataSchema,
  RecentOrderSchema,
  RevenueDataPointSchema,
  StatisticsQuerySchema,
  StatisticsResSchema
} from './statistics.model'

export class StatisticsQueryDTO extends createZodDto(StatisticsQuerySchema) {}
export class OverviewStatsResDTO extends createZodDto(OverviewStatsSchema) {}
export class RevenueDataPointResDTO extends createZodDto(RevenueDataPointSchema) {}
export class CategoryDataResDTO extends createZodDto(CategoryDataSchema) {}
export class OrderVolumeDataResDTO extends createZodDto(OrderVolumeDataSchema) {}
export class RecentOrderResDTO extends createZodDto(RecentOrderSchema) {}
export class PopularProductResDTO extends createZodDto(PopularProductSchema) {}
export class DeliveryPerformanceResDTO extends createZodDto(DeliveryPerformanceSchema) {}
export class CustomerRatingResDTO extends createZodDto(CustomerRatingSchema) {}
export class OrderTypeDataResDTO extends createZodDto(OrderTypeDataSchema) {}
export class ProvinceDeliveryDataResDTO extends createZodDto(ProvinceDeliveryDataSchema) {}
export class StatisticsResDTO extends createZodDto(StatisticsResSchema) {}
