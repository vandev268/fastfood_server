import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { DraftItemService } from './draft-item.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  AllDraftItemQueryDTO,
  ChangeDraftItemStatusBodyDTO,
  ChangeDraftItemTablesBodyDTO,
  CreateDraftItemBodyDTO,
  DeleteDraftItemsBodyDTO,
  DraftItemParamsDTO,
  DraftItemQueryDTO,
  DraftItemResDTO,
  GetAllDraftItemsResDTO,
  GetDraftItemsResDTO,
  UpdateDraftItemBodyDTO
} from './draft-item.dto'
import { MessageResDTO } from 'src/shared/dtos/response.dto'

@Controller('draft-items')
export class DraftItemController {
  constructor(private readonly draftItemService: DraftItemService) {}

  @Get('')
  @ZodSerializerDto(GetDraftItemsResDTO)
  list(@Query() query: DraftItemQueryDTO) {
    return this.draftItemService.list(query)
  }

  @Get('all')
  @ZodSerializerDto(GetAllDraftItemsResDTO)
  findAll(@Query() query: AllDraftItemQueryDTO) {
    return this.draftItemService.findAll(query)
  }

  @Post()
  @ZodSerializerDto(DraftItemResDTO)
  create(@Body() body: CreateDraftItemBodyDTO) {
    return this.draftItemService.create(body)
  }

  @Put(':draftItemId')
  @ZodSerializerDto(MessageResDTO)
  update(@Param() params: DraftItemParamsDTO, @Body() body: UpdateDraftItemBodyDTO) {
    return this.draftItemService.update({ draftItemId: params.draftItemId, data: body })
  }

  @Patch(':draftItemId/status')
  @ZodSerializerDto(MessageResDTO)
  changeStatus(@Param() params: DraftItemParamsDTO, @Body() body: ChangeDraftItemStatusBodyDTO) {
    return this.draftItemService.changeStatus({ draftItemId: params.draftItemId, data: body })
  }

  @Patch('change-tables')
  @ZodSerializerDto(MessageResDTO)
  changeTables(@Body() body: ChangeDraftItemTablesBodyDTO) {
    return this.draftItemService.changeTables(body)
  }

  @Delete(':draftItemId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: DraftItemParamsDTO) {
    return this.draftItemService.delete(params.draftItemId)
  }

  @Post('deletes')
  @ZodSerializerDto(MessageResDTO)
  deleteByDraftCode(@Body() body: DeleteDraftItemsBodyDTO) {
    return this.draftItemService.deleteMany(body)
  }
}
