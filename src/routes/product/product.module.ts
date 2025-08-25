import { Module } from '@nestjs/common'
import { ProductRepo } from './product.repo'
import { ProductController } from './product.controller'
import { ProductService } from './product.service'

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductRepo]
})
export class ProductModule {}
