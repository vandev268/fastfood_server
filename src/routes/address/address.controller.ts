import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Request } from '@nestjs/common'
import { AddressService } from './address.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  AddressDetailResDTO,
  AddressParamsDTO,
  AddressResDTO,
  ChangeAddressDefaultBodyDTO,
  CreateAddressBodyDTO,
  GetAddressesResDTO,
  GetAllAddressesResDTO,
  UpdateAddressBodyDTO
} from './address.dto'
import { UserActive } from 'src/shared/decorators/user-active.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'

@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @ZodSerializerDto(GetAddressesResDTO)
  list(@UserActive('id') userId: number, @Query() query: PaginationQueryDTO) {
    return this.addressService.list({ userId, query })
  }

  @Get('all')
  @ZodSerializerDto(GetAllAddressesResDTO)
  findAll(@UserActive('id') userId: number) {
    return this.addressService.findAll({ userId })
  }

  @Get(':addressId')
  @ZodSerializerDto(AddressDetailResDTO)
  findDetail(@UserActive('id') userId: number, @Param() params: AddressParamsDTO) {
    return this.addressService.findDetail({ userId, addressId: params.addressId })
  }

  @Post()
  @ZodSerializerDto(AddressResDTO)
  create(@UserActive('id') userId: number, @Body() body: CreateAddressBodyDTO) {
    return this.addressService.create({ userId, data: body })
  }

  @Put(':addressId')
  @ZodSerializerDto(AddressResDTO)
  update(@UserActive('id') userId: number, @Param() params: AddressParamsDTO, @Body() body: UpdateAddressBodyDTO) {
    return this.addressService.update({ userId, addressId: params.addressId, data: body })
  }

  @Patch(':addressId')
  @ZodSerializerDto(MessageResDTO)
  changeDefault(
    @UserActive('id') userId: number,
    @Param() params: AddressParamsDTO,
    @Body() body: ChangeAddressDefaultBodyDTO
  ) {
    return this.addressService.changeDefault({ userId, addressId: params.addressId, data: body })
  }

  @Delete(':addressId')
  @ZodSerializerDto(MessageResDTO)
  delete(@UserActive('id') userId: number, @Param() params: AddressParamsDTO) {
    return this.addressService.delete({ userId, addressId: params.addressId })
  }
}
