import { Controller, Get, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { StatisticsQueryDTO, StatisticsResDTO } from './statistics.dto'
import { StatisticsService } from './statistics.service'

@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ZodSerializerDto(StatisticsResDTO)
  getDashboardStatistics(@Query() query: StatisticsQueryDTO) {
    return this.statisticsService.getDashboardStatistics(query)
  }
}
