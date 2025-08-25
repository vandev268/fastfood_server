import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { CategoryService } from './category.service'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import {
  CategoryDetailResDTO,
  CategoryParamsDTO,
  CategoryResDTO,
  CategoryWithParentResDTO,
  CreateCategoryBodyDTO,
  GetAllCategoriesResDTO,
  UpdateCategoryBodyDTO
} from './category.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'
import { Public } from 'src/shared/decorators/auth.decorator'
import { CategoryGateway } from 'src/websockets/category.gateway'
import { Room } from 'src/shared/constants/websocket.constant'

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly categoryGateway: CategoryGateway
  ) {}

  @Get()
  @Public()
  @ZodSerializerDto(CategoryWithParentResDTO)
  list(@Query() query: PaginationQueryDTO) {
    return this.categoryService.list(query)
  }

  @Get('all')
  @Public()
  @ZodSerializerDto(GetAllCategoriesResDTO)
  findAll() {
    return this.categoryService.findAll()
  }

  @Get(':categoryId')
  @Public()
  @ZodSerializerDto(CategoryDetailResDTO)
  findDetail(@Param() params: CategoryParamsDTO) {
    return this.categoryService.findDetail(params.categoryId)
  }

  @Post()
  @ZodSerializerDto(CategoryResDTO)
  create(@Body() body: CreateCategoryBodyDTO) {
    this.categoryGateway.server.to(Room.Category).emit('sended-category', {
      message: 'Category created'
    })
    return this.categoryService.create(body)
  }

  @Put(':categoryId')
  @ZodSerializerDto(CategoryResDTO)
  update(@Param() params: CategoryParamsDTO, @Body() body: UpdateCategoryBodyDTO) {
    this.categoryGateway.server.to(Room.Category).emit('sended-category', {
      message: 'Category updated'
    })
    return this.categoryService.update({ categoryId: params.categoryId, data: body })
  }

  @Delete(':categoryId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: CategoryParamsDTO) {
    this.categoryGateway.server.to(Room.Category).emit('sended-category', {
      message: 'Category deleted'
    })
    return this.categoryService.delete(params.categoryId)
  }
}
