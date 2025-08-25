import { createZodDto } from 'nestjs-zod'
import { ProductParamsSchema, ProductSchema } from 'src/shared/models/shared-product.model'
import {
  ChangeProductStatusBodySchema,
  CreateProductBodySchema,
  GetAllProductsResSchema,
  GetProductsResSchema,
  GetVariantsResSchema,
  ProductDetailSchema,
  ProductQuerySchema,
  UpdateProductBodySchema
} from './product.model'

export class GetVariantsResDTO extends createZodDto(GetVariantsResSchema) {}
export class ProductParamsDTO extends createZodDto(ProductParamsSchema) {}
export class ProductResDTO extends createZodDto(ProductSchema) {}
export class ProductDetailResDTO extends createZodDto(ProductDetailSchema) {}
export class ProductQueryDTO extends createZodDto(ProductQuerySchema) {}
export class GetProductsResDTO extends createZodDto(GetProductsResSchema) {}
export class GetAllProductsResDTO extends createZodDto(GetAllProductsResSchema) {}
export class CreateProductBodyDTO extends createZodDto(CreateProductBodySchema) {}
export class UpdateProductBodyDTO extends createZodDto(UpdateProductBodySchema) {}
export class ChangeProductStatusBodyDTO extends createZodDto(ChangeProductStatusBodySchema) {}
