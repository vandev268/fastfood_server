import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common'
import { CartService } from './cart.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  CartItemParamsDTO,
  CartItemResDTO,
  CreateCartItemBodyDTO,
  DeleteCartItemsBodyDTO,
  GetAllCartItemsResDTO,
  GetCartItemsResDTO
} from './cart.dto'
import { UserActive } from 'src/shared/decorators/user-active.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('')
  @ZodSerializerDto(GetCartItemsResDTO)
  list(@UserActive('id') userId: number, @Query() query: PaginationQueryDTO) {
    return this.cartService.list(userId, query)
  }

  @Get('all')
  @ZodSerializerDto(GetAllCartItemsResDTO)
  findAll(@UserActive('id') userId: number) {
    return this.cartService.findAll(userId)
  }

  @Post()
  @ZodSerializerDto(CartItemResDTO)
  create(@UserActive('id') userId: number, @Body() body: CreateCartItemBodyDTO) {
    return this.cartService.create(userId, body)
  }

  @Put(':cartItemId')
  @ZodSerializerDto(MessageResDTO)
  update(@UserActive('id') userId: number, @Param() params: CartItemParamsDTO, @Body() body: CreateCartItemBodyDTO) {
    return this.cartService.update(userId, params.cartItemId, body)
  }

  @Post('delete-items')
  @ZodSerializerDto(MessageResDTO)
  delete(@UserActive('id') userId: number, @Body() body: DeleteCartItemsBodyDTO) {
    return this.cartService.delete(userId, body)
  }
}
