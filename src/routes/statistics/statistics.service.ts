import { Injectable } from '@nestjs/common'
import { endOfDay, startOfDay, subDays } from 'date-fns'
import { StatisticsQueryDTO } from './statistics.dto'
import { StatisticsRepo } from './statistics.repo'

@Injectable()
export class StatisticsService {
  constructor(private readonly statisticsRepo: StatisticsRepo) {}

  async getDashboardStatistics(query: StatisticsQueryDTO) {
    const { startDate, endDate, timeRange } = query

    let queryStartDate: Date
    let queryEndDate: Date

    if (startDate && endDate) {
      queryStartDate = new Date(startDate)
      queryEndDate = new Date(endDate)
    } else {
      queryEndDate = endOfDay(new Date())

      switch (timeRange) {
        case '1d':
          queryStartDate = startOfDay(new Date())
          break
        case '7d':
          queryStartDate = startOfDay(subDays(new Date(), 7))
          break
        case '30d':
          queryStartDate = startOfDay(subDays(new Date(), 30))
          break
        case '90d':
          queryStartDate = startOfDay(subDays(new Date(), 90))
          break
        default:
          queryStartDate = startOfDay(subDays(new Date(), 7))
      }
    }

    const [
      overviewStats,
      revenueData,
      categoryData,
      orderVolumeData,
      recentOrders,
      popularProducts,
      deliveryPerformance,
      orderTypeData,
      provinceDeliveryData
    ] = await Promise.all([
      this.statisticsRepo.getOverviewStats(queryStartDate, queryEndDate),
      this.statisticsRepo.getRevenueData(queryStartDate, queryEndDate),
      this.statisticsRepo.getCategoryData(queryStartDate, queryEndDate),
      this.statisticsRepo.getOrderVolumeData(queryStartDate, queryEndDate),
      this.statisticsRepo.getRecentOrders(4),
      this.statisticsRepo.getPopularProducts(queryStartDate, queryEndDate, 10),
      this.statisticsRepo.getDeliveryPerformance(),
      this.statisticsRepo.getOrderTypeData(queryStartDate, queryEndDate),
      this.statisticsRepo.getProvinceDeliveryData(queryStartDate, queryEndDate)
    ])

    return {
      overviewStats,
      revenueData,
      categoryData,
      orderVolumeData,
      recentOrders,
      popularProducts,
      deliveryPerformance,
      orderTypeData,
      provinceDeliveryData
    }
  }
}
