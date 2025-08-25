import { z } from 'zod'
import { OrderBy, SortBy } from 'src/shared/constants/common.constant'
import { PaginationQuerySchema } from 'src/shared/models/request.model'
import { CategorySchema } from 'src/shared/models/shared-category.model'
import { ProductSchema, ProductVariantsType, VariantSchema } from 'src/shared/models/shared-product.model'
import { TagSchema } from 'src/shared/models/shared-tag.model'

export const GetVariantsResSchema = z.object({
  data: z.array(VariantSchema),
  totalItems: z.number()
})

function generateVariants(variants: ProductVariantsType) {
  // Hàm hỗ trợ để tạo tất cả tổ hợp
  function getCombinations(arrays: string[][]): string[] {
    return arrays.reduce((acc, curr) => acc.flatMap((x) => curr.map((y) => `${x}${x ? ' / ' : ''}${y}`)), [''])
  }

  // Lấy mảng các options từ variants
  const options = variants.map((variant) => variant.options)

  // Tạo tất cả tổ hợp
  const combinations = getCombinations(options)

  // Chuyển tổ hợp thành SKU objects
  return combinations.map((value) => ({
    value,
    price: 0,
    stock: 0,
    thumbnail: null
  }))
}

export const ProductDetailSchema = ProductSchema.extend({
  variants: z.array(VariantSchema),
  categories: z.array(CategorySchema),
  tags: z.array(TagSchema)
})

export const ProductQuerySchema = PaginationQuerySchema.extend({
  name: z.string().trim().optional(),
  categories: z
    .preprocess((value) => {
      if (typeof value === 'string') {
        return [Number(value)]
      }
      return value
    }, z.array(z.coerce.number().int().positive()))
    .optional(),
  tags: z
    .preprocess((value) => {
      if (typeof value === 'string') {
        return [Number(value)]
      }
      return value
    }, z.array(z.coerce.number().int().positive()))
    .optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  orderBy: z.nativeEnum(OrderBy).default(OrderBy.Desc),
  sortBy: z.nativeEnum(SortBy).default(SortBy.CreatedAt)
})

export const GetProductsResSchema = z.object({
  data: z.array(ProductDetailSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllProductsResSchema = GetProductsResSchema.pick({
  data: true,
  totalItems: true
})

export const UpsertVariantBodySchema = VariantSchema.pick({
  value: true,
  price: true,
  stock: true,
  thumbnail: true
})

export const CreateProductBodySchema = ProductSchema.pick({
  name: true,
  type: true,
  shortDescription: true,
  description: true,
  images: true,
  status: true,
  variantsConfig: true
})
  .extend({
    categories: z.array(z.coerce.number().int().positive()).optional(),
    tags: z.array(z.coerce.number().int().positive()).optional(),
    variants: z.array(UpsertVariantBodySchema)
  })
  .strict()
  .superRefine(({ variantsConfig, variants }, ctx) => {
    for (let i = 0; i < variantsConfig.length; i++) {
      const variant = variantsConfig[i]
      // Kiểm tra các type có trùng lặp
      const typeIndex = variantsConfig.findIndex((v) => v.type.toLowerCase() === variant.type.toLowerCase())
      if (typeIndex !== i) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Type "${variant.type}" is duplicated. Please ensure each type is unique.`,
          path: ['variants']
        })
      }

      // Kiểm tra các options của type có trùng lặp
      const isDuplicateOption = variant.options.some((option, index) => {
        return variant.options.findIndex((o) => o.toLowerCase() === option.toLowerCase()) !== index
      })
      if (isDuplicateOption) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Options for type "${variant.type}" contain duplicates. Please ensure each option is unique.`,
          path: ['variants']
        })
      }
    }
    const variantValues = generateVariants(variantsConfig)
    const allVariants = [
      ...variants,
      ...variantValues.filter((variant) => !variants.some((v) => v.value === variant.value))
    ]
    // Kiểm tra xem kích thước của variants có khớp với variantsConfig không
    // if (allVariants.length !== variants.length) {
    //   ctx.addIssue({
    //     code: z.ZodIssueCode.custom,
    //     message: `The number of variants (${variants.length}) does not match. Please check again.`,
    //     path: ['variants']
    //   })
    // }

    // Kiểm tra xem các giá trị của variants có khớp với variantsConfig không
    for (let i = 0; i < variants.length; i++) {
      const isValid = variants[i].value === allVariants[i].value
      if (!isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Variant value "${variants[i].value}" does not match the expected value "${allVariants[i].value}". Please check again.`,
          path: ['variants']
        })
      }
    }
  })

export const UpdateProductBodySchema = CreateProductBodySchema

export const ChangeProductStatusBodySchema = ProductSchema.pick({
  status: true
}).strict()

export type GetVariantsResType = z.infer<typeof GetVariantsResSchema>
export type ProductQueryType = z.infer<typeof ProductQuerySchema>
export type ProductDetailType = z.infer<typeof ProductDetailSchema>
export type GetProductsResType = z.infer<typeof GetProductsResSchema>
export type GetAllProductsResType = z.infer<typeof GetAllProductsResSchema>
export type UpsertVariantBodyType = z.infer<typeof UpsertVariantBodySchema>
export type CreateProductBodyType = z.infer<typeof CreateProductBodySchema>
export type UpdateProductBodyType = z.infer<typeof UpdateProductBodySchema>
export type ChangeProductStatusBodyType = z.infer<typeof ChangeProductStatusBodySchema>
