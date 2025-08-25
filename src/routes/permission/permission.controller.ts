import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { PermissionService } from './permission.service'
import { ZodSerializerDto } from 'nestjs-zod'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import {
  CreatePermissionBodyDTO,
  GetAllPermissionsResDTO,
  GetPermissionsResDTO,
  PermissionDetailResDTO,
  PermissionParamsDTO,
  PermissionResDTO,
  UpdatePermissionBodyDTO
} from './permission.dto'

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ZodSerializerDto(GetPermissionsResDTO)
  list(@Query() query: PaginationQueryDTO) {
    return this.permissionService.list(query)
  }

  @Get('all')
  @ZodSerializerDto(GetAllPermissionsResDTO)
  findAll() {
    return this.permissionService.findAll()
  }

  @Get(':permissionId')
  @ZodSerializerDto(PermissionDetailResDTO)
  findDetail(@Param() params: PermissionParamsDTO) {
    return this.permissionService.findDetail(params.permissionId)
  }

  @Post()
  @ZodSerializerDto(PermissionResDTO)
  create(@Body() body: CreatePermissionBodyDTO) {
    return this.permissionService.create(body)
  }

  @Put(':permissionId')
  @ZodSerializerDto(PermissionResDTO)
  update(@Param() params: PermissionParamsDTO, @Body() body: UpdatePermissionBodyDTO) {
    return this.permissionService.update({ permissionId: params.permissionId, data: body })
  }

  @Delete(':permissionId')
  @ZodSerializerDto(MessageResDTO)
  delete(@Param() params: PermissionParamsDTO) {
    return this.permissionService.delete(params.permissionId)
  }
}
