import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { ProfileRepo } from './profile.repo'
import { ChangeProfilePasswordBodyType, UpdateProfileBodyType } from './profile.model'
import { S3Service } from 'src/shared/services/s3.service'
import { UtilService } from 'src/shared/services/util.service'
import { UserType } from 'src/shared/models/shared-user.model'
import { SharedUserRepo } from 'src/shared/repositories/shared-user.repo'
import { SharedOrderRepo } from 'src/shared/repositories/shared-order.repo'
import { SharedReservationRepo } from 'src/shared/repositories/shared-reservation.repo'

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepo: ProfileRepo,
    private readonly sharedUserRepo: SharedUserRepo,
    private readonly sharedOrderRepo: SharedOrderRepo,
    private readonly sharedReservationRepo: SharedReservationRepo,
    private readonly s3Service: S3Service,
    private readonly utilService: UtilService
  ) {}

  private async verifyProfileExists(userId: number) {
    const profile = await this.sharedUserRepo.findDetail({ id: userId })
    if (!profile) {
      throw new NotFoundException('Profile not found')
    }
    return profile
  }

  async find(userId: number) {
    return await this.verifyProfileExists(userId)
  }

  async findDetail(userId: number) {
    const profile = await this.verifyProfileExists(userId)
    const orders = await this.sharedOrderRepo.findAll({ userId })
    const reservations = await this.sharedReservationRepo.findAllWithTable({ userId })
    return {
      ...profile,
      orders,
      reservations
    }
  }

  async update(user: UserType, data: UpdateProfileBodyType) {
    const profile = await this.profileRepo.update({ where: { id: user.id }, data })
    if (user.avatar && user.avatar !== profile.avatar) {
      await this.s3Service.deleteFiles([user.avatar])
    }
    return profile
  }

  async changePassword(user: UserType, data: ChangeProfilePasswordBodyType) {
    const isMatch = await this.utilService.compare(data.password, user.password)
    if (!isMatch) {
      throw new UnprocessableEntityException({
        message: 'Password is incorrect',
        path: 'password'
      })
    }
    if (data.newPassword !== data.confirmNewPassword) {
      throw new UnprocessableEntityException({
        message: 'Comfirm new password does not match',
        path: 'confirmNewPassword'
      })
    }

    const hashPassword = await this.utilService.hash(data.newPassword)
    await this.profileRepo.changePassword({ where: { id: user.id }, password: hashPassword })
    return {
      message: 'Password changed successfully'
    }
  }
}
