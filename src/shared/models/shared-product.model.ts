import { z } from 'zod'
import { ProductStatus, TypeProduct } from '../constants/product.constant'

export const ProductVariantSchema = z.object({
  type: z.string().trim(),
  options: z.array(z.string().trim())
})

export const ProductVariantsSchema = z.array(ProductVariantSchema).superRefine((variants, ctx) => {
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i]
    // Kiểm tra các type có trùng lặp
    const typeIndex = variants.findIndex((v) => v.type.toLowerCase() === variant.type.toLowerCase())
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
})

export const ProductSchema = z.object({
  id: z.number(),
  type: z.nativeEnum(TypeProduct).default(TypeProduct.Single),
  name: z.string().min(1).max(1000),
  basePrice: z.number().nonnegative(),
  shortDescription: z.string().default(''),
  description: z.string().default(''),
  images: z.array(z.string()),
  status: z.nativeEnum(ProductStatus).default(ProductStatus.Pending),
  variantsConfig: ProductVariantsSchema,
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export const ProductParamsSchema = z.object({
  productId: z.coerce.number().int().positive()
})

export const VariantSchema = z.object({
  id: z.number(),
  productId: z.number(),
  value: z.string().trim().min(1).max(1000),
  thumbnail: z.string().nullable().default(null),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
})

export type ProductVariantType = z.infer<typeof ProductVariantSchema>
export type ProductVariantsType = z.infer<typeof ProductVariantsSchema>
export type ProductType = z.infer<typeof ProductSchema>
export type ProductParamsType = z.infer<typeof ProductParamsSchema>
export type VariantType = z.infer<typeof VariantSchema>
