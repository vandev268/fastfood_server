import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { RoleService } from './role.service'
import { ZodSerializerDto } from 'nestjs-zod'
import {
  ChangeRoleStatusBodyDTO,
  CreateRoleBodyDTO,
  GetAllRolesResDTO,
  GetRolesResDTO,
  RoleDetailResDTO,
  RoleParamsDTO,
  RoleResDTO,
  UpdateRoleBodyDTO
} from './role.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { UserActive } from 'src/shared/decorators/user-active.decorator'
import { UserDetailType } from 'src/shared/models/shared-user.model'

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ZodSerializerDto(GetRolesResDTO)
  list(@UserActive() user: UserDetailType, @Query() query: PaginationQueryDTO) {
    return this.roleService.list({ handler: user, query })
  }

  @Get('all')
  @ZodSerializerDto(GetAllRolesResDTO)
  findAll(@UserActive() user: UserDetailType) {
    return this.roleService.findAll({ handler: user })
  }

  @Get(':roleId')
  @ZodSerializerDto(RoleDetailResDTO)
  findDetail(@UserActive() user: UserDetailType, @Param() params: RoleParamsDTO) {
    return this.roleService.findDetail({ handler: user, roleId: params.roleId })
  }

  @Post()
  @ZodSerializerDto(RoleResDTO)
  create(@UserActive() user: UserDetailType, @Body() body: CreateRoleBodyDTO) {
    return this.roleService.create({ handler: user, data: body })
  }

  @Put(':roleId')
  @ZodSerializerDto(RoleResDTO)
  update(@UserActive() user: UserDetailType, @Param() params: RoleParamsDTO, @Body() body: UpdateRoleBodyDTO) {
    return this.roleService.update({ handler: user, roleId: params.roleId, data: body })
  }

  @Patch(':roleId/change-status')
  @ZodSerializerDto(MessageResDTO)
  changeStatus(
    @UserActive() user: UserDetailType,
    @Param() params: RoleParamsDTO,
    @Body() body: ChangeRoleStatusBodyDTO
  ) {
    return this.roleService.changeStatus({ handler: user, roleId: params.roleId, data: body })
  }

  @Delete(':roleId')
  @ZodSerializerDto(MessageResDTO)
  delete(@UserActive() user: UserDetailType, @Param() params: RoleParamsDTO) {
    return this.roleService.delete({ handler: user, roleId: params.roleId })
  }
}
