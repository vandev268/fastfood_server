import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { TagService } from './tag.service'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import {
  CreateTagBodyDTO,
  GetAllTagsResDTO,
  GetTagsResDTO,
  TagDetailResDTO,
  TagParamsDTO,
  TagResDTO,
  UpdateTagBodyDTO
} from './tag.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'
import { TagGateway } from 'src/websockets/tag.gateway'
import { Room } from 'src/shared/constants/websocket.constant'

@Controller('tags')
export class TagController {
  constructor(
    private readonly tagService: TagService,
    private readonly tagGateway: TagGateway
  ) {}

  @Get()
  @ZodSerializerDto(GetTagsResDTO)
  list(@Query() query: PaginationQueryDTO) {
    return this.tagService.list(query)
  }

  @Get('all')
  @ZodSerializerDto(GetAllTagsResDTO)
  findAll() {
    return this.tagService.findAll()
  }

  @Get(':tagId')
  @ZodSerializerDto(TagDetailResDTO)
  findDetail(@Param() params: TagParamsDTO) {
    return this.tagService.findDetail(params.tagId)
  }

  @Post()
  @ZodSerializerDto(TagResDTO)
  create(@Body() body: CreateTagBodyDTO) {
    this.tagGateway.server.to(Room.Tag).emit('sended-tag', {
      message: 'Tag created'
    })
    return this.tagService.create(body)
  }

  @Put(':tagId')
  @ZodSerializerDto(TagResDTO)
  update(@Param() params: TagParamsDTO, @Body() body: UpdateTagBodyDTO) {
    this.tagGateway.server.to(Room.Tag).emit('sended-tag', {
      message: 'Tag updated'
    })
    return this.tagService.update({ tagId: params.tagId, data: body })
  }

  @Delete(':tagId')
  @ZodSerializerDto(MessageResDTO)
  async delete(@Param() params: TagParamsDTO) {
    this.tagGateway.server.to(Room.Tag).emit('sended-tag', {
      message: 'Tag deleted'
    })
    await this.tagService.delete(params.tagId)
  }
}
