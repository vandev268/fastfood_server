import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import { ChangeAddressDefaultBodyType, CreateAddressBodyType, UpdateAddressBodyType } from './address.model'
import { PaginationQueryType } from 'src/shared/models/request.model'
import { Prisma } from '@prisma/client'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'

@Injectable()
export class AddressRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list({ where, query }: { where: Prisma.AddressWhereInput; query: PaginationQueryType }) {
    const { page, limit } = query
    const skip = (page - 1) * limit
    const [addresses, totalItems] = await Promise.all([
      this.prismaService.address.findMany({
        where,
        skip,
        take: limit,
        include: {
          province: true,
          district: true,
          ward: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prismaService.address.count({ where })
    ])

    return {
      data: addresses,
      totalItems,
      limit,
      page,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: Prisma.AddressWhereInput) {
    const addresses = await this.prismaService.address.findMany({
      where,
      include: {
        province: true,
        district: true,
        ward: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return {
      data: addresses,
      totalItems: addresses.length
    }
  }

  async findUnique(where: Prisma.AddressWhereUniqueInput) {
    return await this.prismaService.address.findUnique({
      where
    })
  }

  async findDetail(where: Prisma.AddressWhereUniqueInput) {
    return await this.prismaService.address.findUnique({
      where,
      include: {
        province: true,
        district: true,
        ward: true
      }
    })
  }

  async findLocationByIds({
    provinceId,
    districtId,
    wardId
  }: {
    provinceId: number
    districtId: number
    wardId: number
  }) {
    // 1. this.prismaService.$transaction([])
    // 2. this.prismaService.$transaction(async (prisma) => {})
    // 3. Promise.all([])
    const [province, district, ward] = await Promise.all([
      this.prismaService.province.findUnique({ where: { id: provinceId }, include: { districts: true } }),
      this.prismaService.district.findUnique({ where: { id: districtId }, include: { wards: true } }),
      this.prismaService.ward.findUnique({ where: { id: wardId } })
    ])

    return { province, district, ward }
  }

  async create({ userId, data }: { userId: number; data: CreateAddressBodyType }) {
    return await this.prismaService.address.create({
      data: {
        ...data,
        userId
      }
    })
  }

  async update({ where, data }: { where: Prisma.AddressWhereUniqueInput; data: UpdateAddressBodyType }) {
    return await this.prismaService.address.update({
      where,
      data
    })
  }

  async changeDefault({ where, data }: { where: Prisma.AddressWhereUniqueInput; data: ChangeAddressDefaultBodyType }) {
    await this.prismaService.address.updateMany({
      where,
      data: { isDefault: false }
    })
    if (!data.isDefault) {
      return await this.prismaService.address.update({
        where,
        data: { isDefault: true }
      })
    }
    return
  }

  async delete(where: Prisma.AddressWhereUniqueInput) {
    if (envConfig.DELETE_MODE === DeleteMode) {
      return await this.prismaService.address.update({
        where,
        data: { deletedAt: new Date() }
      })
    }
    return await this.prismaService.address.delete({
      where
    })
  }
}
