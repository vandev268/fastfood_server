import { z } from 'zod'

export const StatisticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  timeRange: z.enum(['1d', '7d', '30d', '90d']).optional()
})

export const OverviewStatsSchema = z.object({
  revenue: z.number(),
  orders: z.number(),
  customers: z.number(),
  products: z.number(),
  revenueGrowth: z.number(),
  ordersGrowth: z.number(),
  customersGrowth: z.number(),
  productsGrowth: z.number()
})

export const RevenueDataPointSchema = z.object({
  time: z.string(),
  revenue: z.number(),
  orders: z.number()
})

export const CategoryDataSchema = z.object({
  name: z.string(),
  value: z.number(),
  revenue: z.number(),
  color: z.string()
})

export const OrderVolumeDataSchema = z.object({
  time: z.string(),
  breakfast: z.number(),
  lunch: z.number(),
  dinner: z.number()
})

export const RecentOrderSchema = z.object({
  id: z.string(),
  customer: z.string(),
  items: z.string(),
  total: z.string(),
  status: z.string(),
  time: z.string(),
  address: z.string()
})

export const PopularProductSchema = z.object({
  name: z.string(),
  orders: z.number(),
  revenue: z.string(),
  image: z.string().nullable(),
  rating: z.number(),
  growth: z.number()
})

export const DeliveryPerformanceSchema = z.object({
  onTime: z.number(),
  early: z.number(),
  late: z.number()
})

export const CustomerRatingSchema = z.object({
  fiveStar: z.number(),
  fourStar: z.number(),
  threeStar: z.number(),
  oneToTwoStar: z.number()
})

export const OrderTypeDataSchema = z.object({
  orderType: z.string(),
  orderTypeName: z.string(),
  orderCount: z.number(),
  revenue: z.number(),
  color: z.string()
})

export const ProvinceDeliveryDataSchema = z.object({
  provinceName: z.string(),
  orderCount: z.number(),
  revenue: z.number(),
  color: z.string()
})

export const StatisticsResSchema = z.object({
  overviewStats: OverviewStatsSchema,
  revenueData: z.array(RevenueDataPointSchema),
  categoryData: z.array(CategoryDataSchema),
  orderVolumeData: z.array(OrderVolumeDataSchema),
  recentOrders: z.array(RecentOrderSchema),
  popularProducts: z.array(PopularProductSchema),
  deliveryPerformance: DeliveryPerformanceSchema,
  orderTypeData: z.array(OrderTypeDataSchema),
  provinceDeliveryData: z.array(ProvinceDeliveryDataSchema)
})

export type StatisticsQueryType = z.infer<typeof StatisticsQuerySchema>
export type OverviewStatsType = z.infer<typeof OverviewStatsSchema>
export type RevenueDataPointType = z.infer<typeof RevenueDataPointSchema>
export type CategoryDataType = z.infer<typeof CategoryDataSchema>
export type OrderVolumeDataType = z.infer<typeof OrderVolumeDataSchema>
export type RecentOrderType = z.infer<typeof RecentOrderSchema>
export type PopularProductType = z.infer<typeof PopularProductSchema>
export type DeliveryPerformanceType = z.infer<typeof DeliveryPerformanceSchema>
export type CustomerRatingType = z.infer<typeof CustomerRatingSchema>
export type OrderTypeDataType = z.infer<typeof OrderTypeDataSchema>
export type ProvinceDeliveryDataType = z.infer<typeof ProvinceDeliveryDataSchema>
export type StatisticsResType = z.infer<typeof StatisticsResSchema>
