import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common'
import { AddressRepo } from './address.repo'
import { ChangeAddressDefaultBodyType, CreateAddressBodyType, UpdateAddressBodyType } from './address.model'
import { PaginationQueryType } from 'src/shared/models/request.model'

@Injectable()
export class AddressService {
  constructor(private readonly addressRepo: AddressRepo) {}

  private async verifyAddressExists({ userId, addressId }: { userId: number; addressId: number }) {
    const address = await this.addressRepo.findUnique({ id: addressId, userId, deletedAt: null })
    if (!address) {
      throw new NotFoundException('Address not found')
    }
    return address
  }

  private async verifyLocationExists({
    provinceId,
    districtId,
    wardId
  }: {
    provinceId: number
    districtId: number
    wardId: number
  }) {
    const location = await this.addressRepo.findLocationByIds({ provinceId, districtId, wardId })
    if (!location.province) {
      throw new UnprocessableEntityException({
        message: 'Province not found',
        path: 'provinceId'
      })
    }

    if (!location.district) {
      throw new UnprocessableEntityException({
        message: 'District not found',
        path: 'districtId'
      })
    }
    const isMatchDistrict = location.province.districts.some((d) => d.id === districtId)
    if (!isMatchDistrict) {
      throw new UnprocessableEntityException({
        message: 'District does not belong to the selected province',
        path: 'districtId'
      })
    }

    if (!location.ward) {
      throw new UnprocessableEntityException({
        message: 'Ward not found',
        path: 'wardId'
      })
    }
    const isMatchWard = location.district.wards.some((w) => w.id === wardId)
    if (!isMatchWard) {
      throw new UnprocessableEntityException({
        message: 'Ward does not belong to the selected district',
        path: 'wardId'
      })
    }
  }

  async list({ userId, query }: { userId: number; query: PaginationQueryType }) {
    return this.addressRepo.list({ where: { userId, deletedAt: null }, query })
  }

  async findAll({ userId }: { userId: number }) {
    return this.addressRepo.findAll({ userId, deletedAt: null })
  }

  async findDetail({ userId, addressId }: { userId: number; addressId: number }) {
    const address = await this.addressRepo.findDetail({ id: addressId, userId, deletedAt: null })
    if (!address) {
      throw new NotFoundException('Address not found')
    }
    return address
  }

  async create({ userId, data }: { userId: number; data: CreateAddressBodyType }) {
    await this.verifyLocationExists({
      provinceId: data.provinceId,
      districtId: data.districtId,
      wardId: data.wardId
    })
    return await this.addressRepo.create({ userId, data })
  }

  async update({ userId, addressId, data }: { userId: number; addressId: number; data: UpdateAddressBodyType }) {
    const { id } = await this.verifyAddressExists({ userId, addressId })
    await this.verifyLocationExists({
      provinceId: data.provinceId,
      districtId: data.districtId,
      wardId: data.wardId
    })
    return await this.addressRepo.update({ where: { id }, data })
  }

  async changeDefault({
    userId,
    addressId,
    data
  }: {
    userId: number
    addressId: number
    data: ChangeAddressDefaultBodyType
  }) {
    const { id } = await this.verifyAddressExists({ userId, addressId })
    await this.addressRepo.changeDefault({ where: { id }, data })
    return { message: 'Default address updated successfully' }
  }

  async delete({ userId, addressId }: { userId: number; addressId: number }) {
    const { id } = await this.verifyAddressExists({ userId, addressId })
    await this.addressRepo.delete({ id })
    return { message: 'Address deleted successfully' }
  }
}
