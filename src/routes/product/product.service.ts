import { Injectable, NotFoundException } from '@nestjs/common'
import { ProductRepo } from './product.repo'
import {
  ChangeProductStatusBodyType,
  CreateProductBodyType,
  ProductQueryType,
  UpdateProductBodyType
} from './product.model'
import { isNotFoundPrismaError } from 'src/shared/helpers'
import { S3Service } from 'src/shared/services/s3.service'
import envConfig from 'src/shared/config'
import { DeleteMode } from 'src/shared/constants/common.constant'

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepo: ProductRepo,
    private readonly s3Service: S3Service
  ) {}

  private async verifyProductExists({ productId }: { productId: number }) {
    const product = await this.productRepo.findWithOrderItems({ id: productId, deletedAt: null })
    if (!product) {
      throw new NotFoundException('Product not found')
    }
    return product
  }

  async list(query: ProductQueryType) {
    return await this.productRepo.list(query)
  }

  async findAll() {
    return await this.productRepo.findAll({ deletedAt: null })
  }

  async findDetail(productId: number) {
    const product = await this.productRepo.findDetail({ id: productId, deletedAt: null })
    if (!product) {
      throw new NotFoundException('Product not found')
    }
    return product
  }

  async findVariants(productId: number) {
    const { id } = await this.verifyProductExists({ productId })
    const variants = await this.productRepo.findVariants({ productId: id, deletedAt: null })
    return {
      data: variants,
      totalItems: variants.length
    }
  }

  async create(data: CreateProductBodyType) {
    try {
      const basePrice = data.variants.reduce((min, variant) => Math.min(min, variant.price), Infinity) // 0 if no variants
      const product = await this.productRepo.create({ ...data, basePrice })
      return product
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException({
          message: 'One or more categories or tags not found',
          path: ['categories', 'tags']
        })
      }
      throw error
    }
  }

  async update({ productId, data }: { productId: number; data: UpdateProductBodyType }) {
    const { id, images } = await this.verifyProductExists({ productId })
    try {
      const basePrice = data.variants.reduce((min, variant) => Math.min(min, variant.price), Infinity)
      const product = await this.productRepo.update({ where: { id }, data: { ...data, basePrice } })

      if (product.images && product.images.length > 0) {
        // 1. Lấy danh sách ảnh cũ không còn trong images mới
        const oldImages = images.filter((image) => !product.images.includes(image))

        if (oldImages.length > 0) {
          await this.s3Service.deleteFiles(oldImages)
        }
      }
      return product
    } catch (error) {
      if (isNotFoundPrismaError(error)) {
        throw new NotFoundException({
          message: 'One or more categories or tags not found',
          path: ['categories', 'tags']
        })
      }
      throw error
    }
  }

  async changeStatus({ productId, data }: { productId: number; data: ChangeProductStatusBodyType }) {
    const { id } = await this.verifyProductExists({ productId })
    await this.productRepo.changeStatus({ where: { id }, data })
    return { message: 'Product status updated successfully' }
  }

  async delete(productId: number) {
    const { id, images } = await this.verifyProductExists({ productId })
    await this.productRepo.delete({ id })
    if (envConfig.DELETE_MODE !== DeleteMode && images && images.length > 0) {
      await this.s3Service.deleteFiles(images)
    }
    return { message: 'Product deleted successfully' }
  }
}
