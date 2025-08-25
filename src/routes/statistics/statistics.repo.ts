import { Injectable } from '@nestjs/common'
import { differenceInHours, differenceInDays } from 'date-fns'
import { OrderStatus, OrderType } from 'src/shared/constants/order.constant'
import { PrismaService } from 'src/shared/services/prisma.service'

@Injectable()
export class StatisticsRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async getOverviewStats(startDate: Date, endDate: Date) {
    const [currentPeriodStats, previousPeriodStats] = await Promise.all([
      this.getPeriodStats(startDate, endDate),
      this.getPreviousPeriodStats(startDate, endDate)
    ])

    return {
      ...currentPeriodStats,
      revenueGrowth: this.calculateGrowth(currentPeriodStats.revenue, previousPeriodStats.revenue),
      ordersGrowth: this.calculateGrowth(currentPeriodStats.orders, previousPeriodStats.orders),
      customersGrowth: this.calculateGrowth(currentPeriodStats.customers, previousPeriodStats.customers),
      productsGrowth: this.calculateGrowth(currentPeriodStats.products, previousPeriodStats.products)
    }
  }

  private async getPeriodStats(startDate: Date, endDate: Date) {
    const [orders, users, orderItems] = await Promise.all([
      this.prismaService.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          status: {
            in: [OrderStatus.Completed, OrderStatus.Served]
          },
          deletedAt: null
        },
        select: {
          finalAmount: true,
          userId: true
        }
      }),
      this.prismaService.user.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          deletedAt: null
        }
      }),
      this.prismaService.orderItem.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          order: {
            status: {
              in: [OrderStatus.Completed, OrderStatus.Served]
            },
            deletedAt: null
          }
        }
      })
    ])

    const revenue = orders.reduce((sum, order) => sum + order.finalAmount, 0)
    const uniqueCustomers = new Set(orders.map((order) => order.userId).filter(Boolean)).size

    return {
      revenue,
      orders: orders.length,
      customers: uniqueCustomers || users,
      products: orderItems
    }
  }

  private async getPreviousPeriodStats(startDate: Date, endDate: Date) {
    const periodDuration = endDate.getTime() - startDate.getTime()
    const previousStartDate = new Date(startDate.getTime() - periodDuration)
    const previousEndDate = new Date(startDate.getTime())

    return this.getPeriodStats(previousStartDate, previousEndDate)
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Number((((current - previous) / previous) * 100).toFixed(1))
  }

  // Lấy dữ liệu doanh thu cho biểu đồ
  async getRevenueData(startDate: Date, endDate: Date) {
    const hoursDiff = differenceInHours(endDate, startDate)
    const daysDiff = differenceInDays(endDate, startDate)

    if (hoursDiff <= 24) {
      // Dữ liệu theo giờ cho cùng một ngày
      return this.getHourlyRevenueData(startDate, endDate)
    } else if (daysDiff <= 31) {
      // Dữ liệu theo ngày cho tối đa một tháng
      return this.getDailyRevenueData(startDate, endDate)
    } else {
      // Dữ liệu theo tuần cho khoảng thời gian dài hơn
      return this.getWeeklyRevenueData(startDate, endDate)
    }
  }

  private async getHourlyRevenueData(startDate: Date, endDate: Date) {
    const orders = await this.prismaService.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: [OrderStatus.Completed, OrderStatus.Served]
        },
        deletedAt: null
      },
      select: {
        finalAmount: true,
        createdAt: true
      }
    })

    // Nhóm theo giờ
    const hourlyData = new Map<string, { revenue: number; orders: number }>()

    for (let hour = startDate.getHours(); hour <= endDate.getHours(); hour += 2) {
      const timeKey = `${hour.toString().padStart(2, '0')}:00`
      hourlyData.set(timeKey, { revenue: 0, orders: 0 })
    }

    orders.forEach((order) => {
      const hour = order.createdAt.getHours()
      const roundedHour = Math.floor(hour / 2) * 2
      const timeKey = `${roundedHour.toString().padStart(2, '0')}:00`

      const existing = hourlyData.get(timeKey) || { revenue: 0, orders: 0 }
      hourlyData.set(timeKey, {
        revenue: existing.revenue + order.finalAmount,
        orders: existing.orders + 1
      })
    })

    return Array.from(hourlyData.entries()).map(([time, data]) => ({
      time,
      revenue: data.revenue,
      orders: data.orders
    }))
  }

  private async getDailyRevenueData(startDate: Date, endDate: Date) {
    const orders = await this.prismaService.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: [OrderStatus.Completed, OrderStatus.Served]
        },
        deletedAt: null
      },
      select: {
        finalAmount: true,
        createdAt: true
      }
    })

    // Nhóm theo ngày
    const dailyData = new Map<string, { revenue: number; orders: number }>()

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const timeKey = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
      dailyData.set(timeKey, { revenue: 0, orders: 0 })
    }

    orders.forEach((order) => {
      const date = order.createdAt
      const timeKey = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`

      const existing = dailyData.get(timeKey) || { revenue: 0, orders: 0 }
      dailyData.set(timeKey, {
        revenue: existing.revenue + order.finalAmount,
        orders: existing.orders + 1
      })
    })

    return Array.from(dailyData.entries()).map(([time, data]) => ({
      time,
      revenue: data.revenue,
      orders: data.orders
    }))
  }

  private async getWeeklyRevenueData(startDate: Date, endDate: Date) {
    const orders = await this.prismaService.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: [OrderStatus.Completed, OrderStatus.Served]
        },
        deletedAt: null
      },
      select: {
        finalAmount: true,
        createdAt: true
      }
    })

    // Nhóm theo tuần
    const weeklyData = new Map<string, { revenue: number; orders: number }>()
    const weeksCount = Math.ceil(differenceInDays(endDate, startDate) / 7)

    for (let i = 0; i < weeksCount; i++) {
      weeklyData.set(`Tuần ${i + 1}`, { revenue: 0, orders: 0 })
    }

    orders.forEach((order) => {
      const weekIndex = Math.floor(differenceInDays(order.createdAt, startDate) / 7)
      const timeKey = `Tuần ${weekIndex + 1}`

      const existing = weeklyData.get(timeKey) || { revenue: 0, orders: 0 }
      weeklyData.set(timeKey, {
        revenue: existing.revenue + order.finalAmount,
        orders: existing.orders + 1
      })
    })

    return Array.from(weeklyData.entries()).map(([time, data]) => ({
      time,
      revenue: data.revenue,
      orders: data.orders
    }))
  }

  // Lấy dữ liệu phân bổ danh mục
  async getCategoryData(startDate: Date, endDate: Date) {
    const categoryStats = await this.prismaService.orderItem.groupBy({
      by: ['productId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        order: {
          status: {
            in: [OrderStatus.Completed, OrderStatus.Served]
          },
          deletedAt: null
        }
      },
      _sum: {
        price: true,
        quantity: true
      },
      _count: true
    })

    const productIds = categoryStats.map((stat) => stat.productId).filter(Boolean)
    const products = await this.prismaService.product.findMany({
      where: {
        id: { in: productIds.filter((product) => product !== null) },
        deletedAt: null
      },
      include: {
        categories: true
      }
    })

    // Nhóm theo danh mục
    const categoryMap = new Map<string, { revenue: number; count: number }>()

    categoryStats.forEach((stat) => {
      const product = products.find((p) => p.id === stat.productId)
      if (product && product.categories.length > 0) {
        const categoryName = product.categories[0].name
        const revenue = stat._sum.price || 0

        const existing = categoryMap.get(categoryName) || { revenue: 0, count: 0 }
        categoryMap.set(categoryName, {
          revenue: existing.revenue + revenue,
          count: existing.count + stat._count
        })
      }
    })

    const totalRevenue = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.revenue, 0)
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

    return Array.from(categoryMap.entries()).map(([name, data], index) => ({
      name,
      value: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
      revenue: data.revenue,
      color: colors[index % colors.length]
    }))
  }

  // Lấy dữ liệu khối lượng đơn hàng theo thời gian trong ngày
  async getOrderVolumeData(startDate: Date, endDate: Date) {
    const orders = await this.prismaService.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: [OrderStatus.Completed, OrderStatus.Served, OrderStatus.Preparing, OrderStatus.Ready]
        },
        deletedAt: null
      },
      select: {
        createdAt: true
      }
    })

    const hoursDiff = differenceInHours(endDate, startDate)

    if (hoursDiff <= 24) {
      // Phân chia theo giờ cho cùng một ngày
      const hourlyData = new Map<string, { breakfast: number; lunch: number; dinner: number }>()

      for (let hour = startDate.getHours(); hour <= endDate.getHours(); hour += 3) {
        const timeKey = `${hour.toString().padStart(2, '0')}:00`
        hourlyData.set(timeKey, { breakfast: 0, lunch: 0, dinner: 0 })
      }

      orders.forEach((order) => {
        const hour = order.createdAt.getHours()
        const roundedHour = Math.floor(hour / 3) * 3
        const timeKey = `${roundedHour.toString().padStart(2, '0')}:00`

        const existing = hourlyData.get(timeKey) || { breakfast: 0, lunch: 0, dinner: 0 }

        if (hour >= 6 && hour <= 10) {
          existing.breakfast++
        } else if (hour >= 11 && hour <= 14) {
          existing.lunch++
        } else if (hour >= 17 && hour <= 21) {
          existing.dinner++
        }

        hourlyData.set(timeKey, existing)
      })

      return Array.from(hourlyData.entries()).map(([time, data]) => ({
        time,
        breakfast: data.breakfast,
        lunch: data.lunch,
        dinner: data.dinner
      }))
    } else {
      // Phân chia theo ngày
      const dailyData = new Map<string, { breakfast: number; lunch: number; dinner: number }>()

      for (let d = new Date(startDate); d <= endDate && dailyData.size <= 14; d.setDate(d.getDate() + 1)) {
        const timeKey = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
        dailyData.set(timeKey, { breakfast: 0, lunch: 0, dinner: 0 })
      }

      orders.forEach((order) => {
        const date = order.createdAt
        const timeKey = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
        const hour = date.getHours()

        const existing = dailyData.get(timeKey) || { breakfast: 0, lunch: 0, dinner: 0 }

        if (hour >= 6 && hour <= 10) {
          existing.breakfast++
        } else if (hour >= 11 && hour <= 14) {
          existing.lunch++
        } else if (hour >= 17 && hour <= 21) {
          existing.dinner++
        }

        dailyData.set(timeKey, existing)
      })

      return Array.from(dailyData.entries()).map(([time, data]) => ({
        time,
        breakfast: data.breakfast,
        lunch: data.lunch,
        dinner: data.dinner
      }))
    }
  }

  // Lấy đơn hàng gần đây
  async getRecentOrders(limit: number = 5) {
    const orders = await this.prismaService.order.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        user: true,
        deliveryAddress: true,
        orderItems: {
          take: 2,
          select: {
            productName: true
          }
        }
      }
    })

    return orders.map((order) => {
      const items = order.orderItems.map((item) => item.productName).join(', ')
      const itemsDisplay = order.orderItems.length > 2 ? `${items}...` : items

      const now = new Date()
      const diffMs = now.getTime() - order.createdAt.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMins / 60)

      let timeAgo: string
      if (diffMins < 60) {
        timeAgo = `${diffMins} phút trước`
      } else if (diffHours < 24) {
        timeAgo = `${diffHours} giờ trước`
      } else {
        timeAgo = `${Math.floor(diffHours / 24)} ngày trước`
      }

      return {
        id: `#${order.id}`,
        customer: order.user?.name || order.customerName || 'Khách hàng',
        items: itemsDisplay,
        total: `${order.finalAmount.toLocaleString('vi-VN')}₫`,
        status: order.status.toLowerCase(),
        time: timeAgo,
        address: order.deliveryAddress ? 'Giao hàng' : 'Ăn tại chỗ'
      }
    })
  }

  // Lấy sản phẩm phổ biến
  async getPopularProducts(startDate: Date, endDate: Date, limit: number = 10) {
    const productStats = await this.prismaService.orderItem.groupBy({
      by: ['productId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        order: {
          status: {
            in: [OrderStatus.Completed, OrderStatus.Served]
          },
          deletedAt: null
        }
      },
      _sum: {
        price: true,
        quantity: true
      },
      _count: true,
      take: limit,
      orderBy: {
        _count: { quantity: 'desc' }
      }
    })

    const productIds = productStats.map((stat) => stat.productId).filter(Boolean)
    const [products, reviews] = await Promise.all([
      this.prismaService.product.findMany({
        where: {
          id: { in: productIds.filter((product) => product !== null) },
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          images: true
        }
      }),
      this.prismaService.review.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds.filter((product) => product !== null) },
          deletedAt: null
        },
        _avg: {
          rating: true
        }
      })
    ])

    return productStats.map((stat) => {
      const product = products.find((p) => p.id === stat.productId)
      const review = reviews.find((r) => r.productId === stat.productId)

      return {
        name: product?.name || 'Sản phẩm không xác định',
        orders: stat._count,
        revenue: `${(stat._sum.price || 0).toLocaleString('vi-VN')}₫`,
        image: product?.images?.[0] || null,
        rating: review?._avg.rating ? Number(review._avg.rating.toFixed(1)) : 0,
        growth: Math.floor(Math.random() * 30 - 5) // Placeholder cho tính toán tăng trưởng
      }
    })
  }

  // Lấy hiệu suất giao hàng (placeholder - triển khai dựa trên theo dõi giao hàng của bạn)
  getDeliveryPerformance() {
    return {
      onTime: 85,
      early: 12,
      late: 3
    }
  }

  // Lấy đánh giá khách hàng
  async getCustomerRating(startDate: Date, endDate: Date) {
    const ratings = await this.prismaService.review.groupBy({
      by: ['rating'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        deletedAt: null
      },
      _count: true
    })

    const totalReviews = ratings.reduce((sum, rating) => sum + rating._count, 0)

    if (totalReviews === 0) {
      return {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        oneToTwoStar: 0
      }
    }

    const ratingMap = new Map(ratings.map((r) => [Math.floor(r.rating), r._count]))

    return {
      fiveStar: Math.round(((ratingMap.get(5) || 0) / totalReviews) * 100),
      fourStar: Math.round(((ratingMap.get(4) || 0) / totalReviews) * 100),
      threeStar: Math.round(((ratingMap.get(3) || 0) / totalReviews) * 100),
      oneToTwoStar: Math.round((((ratingMap.get(1) || 0) + (ratingMap.get(2) || 0)) / totalReviews) * 100)
    }
  }

  // Lấy thống kê đơn hàng theo loại đơn hàng
  async getOrderTypeData(startDate: Date, endDate: Date) {
    const orderTypeStats = await this.prismaService.order.groupBy({
      by: ['orderType'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: {
          in: [OrderStatus.Completed, OrderStatus.Served]
        },
        deletedAt: null
      },
      _count: {
        id: true
      },
      _sum: {
        finalAmount: true
      }
    })

    // Định nghĩa màu sắc cho các loại đơn hàng khác nhau
    const ORDER_TYPE_COLORS = {
      [OrderType.Delivery]: '#0088FE',
      [OrderType.DineIn]: '#00C49F',
      [OrderType.Takeaway]: '#FFBB28'
    }

    // Ánh xạ loại đơn hàng sang tên tiếng Việt
    const ORDER_TYPE_NAMES = {
      [OrderType.Delivery]: 'Giao hàng',
      [OrderType.DineIn]: 'Ăn tại chỗ',
      [OrderType.Takeaway]: 'Mang đi'
    }

    // Tạo một map từ thống kê để tra cứu nhanh
    const statsMap = new Map(
      orderTypeStats.map((stat) => [
        stat.orderType,
        {
          orderCount: stat._count.id,
          revenue: stat._sum.finalAmount || 0
        }
      ])
    )

    // Luôn trả về tất cả 3 loại đơn hàng, ngay cả khi chúng có 0 dữ liệu
    const allOrderTypes = [OrderType.Delivery, OrderType.DineIn, OrderType.Takeaway]

    return allOrderTypes.map((orderType) => {
      const stats = statsMap.get(orderType) || { orderCount: 0, revenue: 0 }
      return {
        orderType,
        orderTypeName: ORDER_TYPE_NAMES[orderType] || 'Không xác định',
        orderCount: stats.orderCount,
        revenue: stats.revenue,
        color: ORDER_TYPE_COLORS[orderType] || '#8884d8'
      }
    })
  } // Lấy dữ liệu đơn hàng giao theo tỉnh cho biểu đồ
  async getProvinceDeliveryData(startDate: Date, endDate: Date) {
    const provinceStats = await this.prismaService.order.groupBy({
      by: ['deliveryAddressId'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        orderType: OrderType.Delivery,
        status: {
          in: [OrderStatus.Completed, OrderStatus.Served]
        },
        deliveryAddressId: {
          not: null
        },
        deletedAt: null
      },
      _count: {
        id: true
      },
      _sum: {
        finalAmount: true
      }
    })

    // Lấy tên tỉnh cho các địa chỉ
    const addressIds = provinceStats.map((stat) => stat.deliveryAddressId).filter(Boolean)
    const addresses = await this.prismaService.address.findMany({
      where: {
        id: {
          in: addressIds.filter((id) => id !== null)
        }
      },
      include: {
        province: true
      }
    })

    // Tạo một map từ addressId sang tên tỉnh
    const addressToProvinceMap = new Map(addresses.map((addr) => [addr.id, addr.province.name]))

    // Nhóm theo tỉnh
    const provinceMap = new Map<string, { orderCount: number; revenue: number }>()

    provinceStats.forEach((stat) => {
      const provinceName = addressToProvinceMap.get(stat.deliveryAddressId!)
      if (provinceName) {
        const existing = provinceMap.get(provinceName) || { orderCount: 0, revenue: 0 }
        provinceMap.set(provinceName, {
          orderCount: existing.orderCount + stat._count.id,
          revenue: existing.revenue + (stat._sum.finalAmount || 0)
        })
      }
    })

    // Chuyển đổi thành mảng và sắp xếp theo số lượng đơn hàng (giảm dần)
    const provinceData = Array.from(provinceMap.entries())
      .map(([provinceName, data]) => ({
        provinceName,
        orderCount: data.orderCount,
        revenue: data.revenue,
        color: ''
      }))
      .sort((a, b) => b.orderCount - a.orderCount)

    // Định nghĩa màu sắc cho biểu đồ (5 màu chính + 1 màu "Khác")
    const PROVINCE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

    // Lấy 5 tỉnh hàng đầu và nhóm phần còn lại thành "Khác"
    const topProvinces = provinceData.slice(0, 5)
    const otherProvinces = provinceData.slice(5)

    // Gán màu sắc cho các tỉnh hàng đầu
    topProvinces.forEach((province, index) => {
      province.color = PROVINCE_COLORS[index]
    })

    // Thêm danh mục "Khác" nếu có hơn 5 tỉnh
    const result = [...topProvinces]
    if (otherProvinces.length > 0) {
      const otherOrderCount = otherProvinces.reduce((sum, p) => sum + p.orderCount, 0)
      const otherRevenue = otherProvinces.reduce((sum, p) => sum + p.revenue, 0)

      result.push({
        provinceName: 'Khác',
        orderCount: otherOrderCount,
        revenue: otherRevenue,
        color: PROVINCE_COLORS[5]
      })
    }

    return result
  }
}
