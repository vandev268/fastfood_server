import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { TableService } from './table.service'
import {
  ChangeTableStatusBodyDTO,
  CreateTableBodyDTO,
  GetAllTablesResDTO,
  GetTablesResDTO,
  TableDetailResDTO,
  TableParamsDTO,
  TableResDTO,
  UpdateTableBodyDTO
} from './table.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'
import { TableGateway } from 'src/websockets/table.gateway'
import { Room } from 'src/shared/constants/websocket.constant'
import { Public } from 'src/shared/decorators/auth.decorator'

@Controller('tables')
export class TableController {
  constructor(
    private readonly tableService: TableService,
    private readonly tableGateway: TableGateway
  ) {}

  @Get()
  @Public()
  @ZodSerializerDto(GetTablesResDTO)
  list(@Query() query: PaginationQueryDTO) {
    return this.tableService.list(query)
  }

  @Get('all')
  @Public()
  @ZodSerializerDto(GetAllTablesResDTO)
  findAll() {
    return this.tableService.findAll()
  }

  @Get(':tableId')
  @Public()
  @ZodSerializerDto(TableDetailResDTO)
  findDetail(@Param() params: TableParamsDTO) {
    return this.tableService.findDetail(params.tableId)
  }

  @Post()
  @ZodSerializerDto(TableResDTO)
  create(@Body() body: CreateTableBodyDTO) {
    this.tableGateway.server.emit('sended-table', {
      message: 'Table created'
    })
    return this.tableService.create(body)
  }

  @Put(':tableId')
  @ZodSerializerDto(TableResDTO)
  update(@Param() params: TableParamsDTO, @Body() body: UpdateTableBodyDTO) {
    this.tableGateway.server.to(Room.Table).emit('sended-table', {
      message: 'Table updated'
    })
    return this.tableService.update({ tableId: params.tableId, data: body })
  }

  @Patch(':tableId/change-status')
  @ZodSerializerDto(MessageResDTO)
  changeStatus(@Param() params: TableParamsDTO, @Body() body: ChangeTableStatusBodyDTO) {
    this.tableGateway.server.to(Room.Table).emit('sended-table', {
      message: 'Table status changed'
    })
    return this.tableService.changeStatus({ tableId: params.tableId, data: body })
  }

  @Delete(':tableId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: TableParamsDTO) {
    this.tableGateway.server.to(Room.Table).emit('sended-table', {
      message: 'Table deleted'
    })
    return this.tableService.delete(params.tableId)
  }
}
