import { z } from 'zod'
import { CategorySchema } from 'src/shared/models/shared-category.model'

export const CategoryWithParentSchema = CategorySchema.extend({
  parentCategory: CategorySchema.pick({
    id: true,
    name: true,
    thumbnail: true
  })
    .nullable()
    .default(null)
})

export const CategoryDetailSchema = CategoryWithParentSchema.extend({
  childCategories: z
    .array(
      CategorySchema.pick({
        id: true,
        name: true,
        thumbnail: true
      })
    )
    .default([])
})

export const CategoryParamsSchema = z.object({
  categoryId: z.coerce.number().int().positive()
})

export const GetCategoriesResSchema = z.object({
  data: z.array(CategoryWithParentSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number()
})

export const GetAllCategoriesResSchema = GetCategoriesResSchema.pick({
  data: true,
  totalItems: true
})

export const CreateCategoryBodySchema = CategorySchema.pick({
  name: true,
  thumbnail: true,
  parentCategoryId: true,
  description: true
}).strict()

export const UpdateCategoryBodySchema = CreateCategoryBodySchema

export type CategoryWithParentType = z.infer<typeof CategoryWithParentSchema>
export type CategoryDetailType = z.infer<typeof CategoryDetailSchema>
export type CategoryParamsType = z.infer<typeof CategoryParamsSchema>
export type GetCategoriesResType = z.infer<typeof GetCategoriesResSchema>
export type GetAllCategoriesResType = z.infer<typeof GetAllCategoriesResSchema>
export type CreateCategoryBodyType = z.infer<typeof CreateCategoryBodySchema>
export type UpdateCategoryBodyType = z.infer<typeof UpdateCategoryBodySchema>
