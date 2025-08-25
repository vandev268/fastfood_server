import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common'
import { UserService } from './user.service'
import { ZodSerializerDto } from 'nestjs-zod'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import {
  ChangeUserPasswordBodyDTO,
  ChangeUserStatusBodyDTO,
  CreateUserBodyDTO,
  GetAllUsersResDTO,
  GetUsersResDTO,
  UpdateUserBodyDTO,
  UserDetailResDTO,
  UserParamsDTO,
  UserResDTO
} from './user.dto'
import { PaginationQueryDTO } from 'src/shared/dtos/request.dto'
import { UserActive } from 'src/shared/decorators/user-active.decorator'
import { UserDetailType } from 'src/shared/models/shared-user.model'

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ZodSerializerDto(GetUsersResDTO)
  list(@Query() query: PaginationQueryDTO) {
    return this.userService.list(query)
  }

  @Get('all')
  @ZodSerializerDto(GetAllUsersResDTO)
  findAll() {
    return this.userService.findAll()
  }

  @Get(':userId')
  @ZodSerializerDto(UserDetailResDTO)
  findDetail(@Param() params: UserParamsDTO) {
    return this.userService.findDetail(params.userId)
  }

  @Post()
  @ZodSerializerDto(UserResDTO)
  create(@UserActive() user: UserDetailType, @Body() body: CreateUserBodyDTO) {
    return this.userService.create({ handler: user, data: body })
  }

  @Put(':userId')
  @ZodSerializerDto(UserResDTO)
  update(@UserActive() user: UserDetailType, @Param() params: UserParamsDTO, @Body() body: UpdateUserBodyDTO) {
    return this.userService.update({ handler: user, userId: params.userId, data: body })
  }

  @Patch(':userId/change-password')
  @ZodSerializerDto(MessageResDTO)
  changePassword(
    @UserActive() user: UserDetailType,
    @Param() params: UserParamsDTO,
    @Body() body: ChangeUserPasswordBodyDTO
  ) {
    return this.userService.changePassword({ handler: user, userId: params.userId, data: body })
  }

  @Patch(':userId/change-status')
  @ZodSerializerDto(MessageResDTO)
  async changeStatus(
    @UserActive() user: UserDetailType,
    @Param() params: UserParamsDTO,
    @Body() body: ChangeUserStatusBodyDTO
  ) {
    await this.userService.changeStatus({ handler: user, userId: params.userId, data: body })
    return {
      message: 'User status updated successfully'
    }
  }

  @Delete(':userId')
  @ZodSerializerDto(MessageResDTO)
  async delete(@UserActive() user: UserDetailType, @Param() params: UserParamsDTO) {
    await this.userService.delete({ handler: user, userId: params.userId })
    return {
      message: 'User deleted successfully'
    }
  }
}
