import { Body, Controller, Get, Patch, Put } from '@nestjs/common'
import { ZodSerializerDto } from 'nestjs-zod'
import { UserActive } from 'src/shared/decorators/user-active.decorator'
import { MessageResDTO } from 'src/shared/dtos/response.dto'
import { ChangeProfilePasswordBodyDTO, ProfileDetailResDTO, ProfileResDTO, UpdateProfileBodyDTO } from './profile.dto'
import { UserType } from 'src/shared/models/shared-user.model'
import { ProfileService } from './profile.service'

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('')
  @ZodSerializerDto(ProfileResDTO)
  find(@UserActive('id') userId: number) {
    return this.profileService.find(userId)
  }

  @Get('orders')
  @ZodSerializerDto(ProfileDetailResDTO)
  findDetail(@UserActive('id') userId: number) {
    return this.profileService.findDetail(userId)
  }

  @Put('')
  @ZodSerializerDto(ProfileResDTO)
  update(@UserActive() user: UserType, @Body() body: UpdateProfileBodyDTO) {
    return this.profileService.update(user, body)
  }

  @Patch('change-password')
  @ZodSerializerDto(MessageResDTO)
  changePassword(@UserActive() user: UserType, @Body() body: ChangeProfilePasswordBodyDTO) {
    return this.profileService.changePassword(user, body)
  }
}
