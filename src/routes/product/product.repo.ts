import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/shared/services/prisma.service'
import {
  ChangeProductStatusBodyType,
  CreateProductBodyType,
  ProductQueryType,
  UpdateProductBodyType
} from './product.model'
import { Prisma } from '@prisma/client'
import { DeleteMode, SortBy } from 'src/shared/constants/common.constant'
import { ProductType } from 'src/shared/models/shared-product.model'
import envConfig from 'src/shared/config'

@Injectable()
export class ProductRepo {
  constructor(private readonly prismaService: PrismaService) {}

  async list(query: ProductQueryType) {
    const { page, limit, orderBy, sortBy, categories, maxPrice, minPrice, name, tags } = query
    const skip = (page - 1) * limit

    const where: Prisma.ProductWhereInput = {
      deletedAt: null
    }
    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive'
      }
    }
    if (categories && categories.length > 0) {
      where.categories = {
        some: {
          id: {
            in: categories
          }
        }
      }
    }
    if (tags && tags.length > 0) {
      where.tags = {
        some: {
          id: {
            in: tags
          }
        }
      }
    }
    if (minPrice !== undefined && maxPrice !== undefined) {
      where.basePrice = {
        gte: minPrice,
        lte: maxPrice
      }
    } else if (minPrice !== undefined) {
      where.basePrice = {
        gte: minPrice
      }
    } else if (maxPrice !== undefined) {
      where.basePrice = {
        lte: maxPrice
      }
    }

    let caculatedOrderBy: Prisma.ProductOrderByWithRelationInput = {
      createdAt: orderBy
    }
    if (sortBy === SortBy.Price) {
      caculatedOrderBy = {
        basePrice: orderBy
      }
    } else if (sortBy === SortBy.Sale) {
      caculatedOrderBy = {
        orderItems: {
          _count: orderBy
        }
      }
    }
    const [products, totalItems] = await Promise.all([
      this.prismaService.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          variants: {
            where: {
              deletedAt: null
            }
          },
          categories: {
            where: {
              deletedAt: null
            }
          },
          tags: {
            where: {
              deletedAt: null
            }
          }
        },
        orderBy: caculatedOrderBy
      }),
      this.prismaService.product.count({ where })
    ])

    return {
      data: products,
      totalItems,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit)
    }
  }

  async findAll(where: Prisma.ProductWhereInput) {
    const products = await this.prismaService.product.findMany({
      where,
      include: {
        variants: {
          where: {
            deletedAt: null
          }
        },
        categories: {
          where: {
            deletedAt: null
          }
        },
        tags: {
          where: {
            deletedAt: null
          }
        }
      },
      orderBy: { name: 'asc' }
    })
    return {
      data: products,
      totalItems: products.length
    }
  }

  async findUnique(where: Prisma.ProductWhereUniqueInput) {
    return await this.prismaService.product.findUnique({
      where
    })
  }

  async findDetail(where: Prisma.ProductWhereUniqueInput) {
    return await this.prismaService.product.findUnique({
      where,
      include: {
        variants: {
          where: {
            deletedAt: null
          }
        },
        categories: {
          where: {
            deletedAt: null
          }
        },
        tags: {
          where: {
            deletedAt: null
          }
        },
        reviews: {
          where: {
            deletedAt: null
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      }
    })
  }

  async findWithOrderItems(where: Prisma.ProductWhereUniqueInput) {
    return await this.prismaService.product.findUnique({
      where,
      include: {
        orderItems: true
      }
    })
  }

  async findVariants(where: Prisma.VariantWhereInput) {
    return await this.prismaService.variant.findMany({
      where
    })
  }

  async create(data: CreateProductBodyType & Pick<ProductType, 'basePrice'>) {
    const { categories, tags, variants, ...productData } = data
    return await this.prismaService.product.create({
      data: {
        ...productData,
        categories: categories
          ? {
              connect: categories.map((id) => ({ id }))
            }
          : undefined,
        tags: tags
          ? {
              connect: tags.map((id) => ({ id }))
            }
          : undefined,
        variants: {
          createMany: {
            data: variants
          }
        }
      }
    })
  }

  async update({
    where,
    data
  }: {
    where: { id: number }
    data: UpdateProductBodyType & Pick<ProductType, 'basePrice'>
  }) {
    const { categories, tags, variants, ...productData } = data
    // Variants đã tồn tại trong DB nhưng không có trong data payload thì sẽ bị xóa
    // Variants đã tồn tại trong DB nhưng có trong data payload thì sẽ được cập nhật
    // Variants không tồn tại trong DB nhưng có trong data payload thì sẽ được thêm mới

    // 1. Lấy Variants trong DB
    const variantsInDb = await this.prismaService.variant.findMany({
      where: {
        productId: where.id,
        deletedAt: null
      }
    })

    // 2. Tìm các Variants cần xóa
    const variantsToDelete = variantsInDb.filter((variant) => {
      return variants.every((v) => v.value !== variant.value)
    })

    // 3. Mapping các Variants với id
    const variantsWithId = variants.map((variant) => {
      const existingVariant = variantsInDb.find((v) => v.value === variant.value)
      return {
        ...variant,
        id: existingVariant ? existingVariant.id : null
      }
    })

    // 4. Tìm các Variants cần cập nhật
    const variantsToUpdate = variantsWithId.filter((variant) => variant.id !== null)

    // 5. Tìm các Variants cần tạo mới
    const variantsToCreate = variantsWithId
      .filter((variant) => variant.id === null)
      .map((variant) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...data } = variant
        return {
          ...data,
          productId: where.id // Tạo liên kết với productId đến product đang cập nhật
        }
      })

    const [product] = await this.prismaService.$transaction([
      this.prismaService.product.update({
        where,
        data: {
          ...productData,
          categories: categories
            ? {
                set: categories.map((id) => ({ id }))
              }
            : undefined,
          tags: tags
            ? {
                set: tags.map((id) => ({ id }))
              }
            : undefined
        }
      }),
      this.prismaService.variant.updateMany({
        where: {
          id: {
            in: variantsToDelete.map((variant) => variant.id)
          }
        },
        data: {
          deletedAt: new Date()
        }
      }),
      ...variantsToUpdate.map((variant) => {
        return this.prismaService.variant.update({
          where: { id: variant.id as number },
          data: {
            value: variant.value,
            price: variant.price,
            stock: variant.stock,
            thumbnail: variant.thumbnail
          }
        })
      }),
      this.prismaService.variant.createMany({
        data: variantsToCreate
      })
    ])

    return product
  }

  async changeStatus({ where, data }: { where: Prisma.ProductWhereUniqueInput; data: ChangeProductStatusBodyType }) {
    return await this.prismaService.product.update({
      where,
      data
    })
  }

  async delete(where: Prisma.ProductWhereUniqueInput) {
    if (envConfig.DELETE_MODE === DeleteMode) {
      return await this.prismaService.product.update({
        where,
        data: { deletedAt: new Date() }
      })
    }
    return await this.prismaService.product.delete({
      where
    })
  }
}
