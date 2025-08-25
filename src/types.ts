/* eslint-disable @typescript-eslint/no-namespace */
import { ProductVariantsType } from './shared/models/shared-product.model'

declare global {
  namespace PrismaJson {
    type ProductVariants = ProductVariantsType
  }
}
