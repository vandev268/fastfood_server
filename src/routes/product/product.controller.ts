import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import {
  ChangeProductStatusBodyDTO,
  CreateProductBodyDTO,
  GetAllProductsResDTO,
  GetProductsResDTO,
  GetVariantsResDTO,
  ProductDetailResDTO,
  ProductParamsDTO,
  ProductQueryDTO,
  ProductResDTO,
  UpdateProductBodyDTO
} from './product.dto'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { Room } from 'src/shared/constants/websocket.constant'
import { ProductGateway } from 'src/websockets/product.gateway'
import { ProductService } from './product.service'
import { Public } from 'src/shared/decorators/auth.decorator'

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly productGateway: ProductGateway
  ) {}

  @Get()
  @Public()
  @ZodSerializerDto(GetProductsResDTO)
  list(@Query() query: ProductQueryDTO) {
    return this.productService.list(query)
  }

  @Get('all')
  @Public()
  @ZodSerializerDto(GetAllProductsResDTO)
  findAll() {
    return this.productService.findAll()
  }

  @Get(':productId')
  @Public()
  @ZodSerializerDto(ProductDetailResDTO)
  findDetail(@Param() params: ProductParamsDTO) {
    return this.productService.findDetail(params.productId)
  }

  @Get(':productId/variants')
  @Public()
  @ZodSerializerDto(GetVariantsResDTO)
  findVariants(@Param() params: ProductParamsDTO) {
    return this.productService.findVariants(params.productId)
  }

  @Post()
  @ZodSerializerDto(ProductResDTO)
  create(@Body() body: CreateProductBodyDTO) {
    this.productGateway.server.to(Room.Product).emit('sended-product', {
      message: 'A new product has been created'
    })
    return this.productService.create(body)
  }

  @Put(':productId')
  @ZodSerializerDto(ProductResDTO)
  update(@Param() params: ProductParamsDTO, @Body() body: UpdateProductBodyDTO) {
    this.productGateway.server.to(Room.Product).emit('updated-product', {
      message: 'A product has been updated'
    })
    return this.productService.update({ productId: params.productId, data: body })
  }

  @Patch(':productId/change-status')
  @ZodSerializerDto(MessageResDTO)
  changeStatus(@Param() params: ProductParamsDTO, @Body() body: ChangeProductStatusBodyDTO) {
    this.productGateway.server.to(Room.Product).emit('updated-product', {
      message: `A product status has been changed`
    })
    return this.productService.changeStatus({ productId: params.productId, data: body })
  }

  @Delete(':productId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: ProductParamsDTO) {
    this.productGateway.server.to(Room.Product).emit('sended-product', {
      message: 'A product has been deleted'
    })
    return this.productService.delete(params.productId)
  }
}
