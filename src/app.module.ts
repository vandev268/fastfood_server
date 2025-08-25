import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { SharedModule } from './shared/shared.module'
import { AuthModule } from './routes/auth/auth.module'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ZodSerializerInterceptor } from 'nestjs-zod'
import CustomZodValidationPipe from './shared/pipes/custom-zod-validation.pipe'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'
import { RoleModule } from './routes/role/role.module'
import { PermissionModule } from './routes/permission/permission.module'
import { ProvinceModule } from './routes/province/province.module'
import { DistrictModule } from './routes/district/district.module'
import { WardModule } from './routes/ward/ward.module'
import { AddressModule } from './routes/address/address.module'
import { MediaModule } from './routes/media/media.module'
import { UserModule } from './routes/user/user.module'
import { ProductModule } from './routes/product/product.module'
import { CategoryModule } from './routes/category/category.module'
import { TagModule } from './routes/tag/tag.module'
import { CartModule } from './routes/cart/cart.module'
import { TableModule } from './routes/table/table.module'
import { DraftItemModule } from './routes/draft-item/draft-item.module'
import { ReservationModule } from './routes/reservation/reservation.module'
import { CouponModule } from './routes/coupon/coupon.module'
import { OrderModule } from './routes/order/order.module'

@Module({
  imports: [
    SharedModule,
    AuthModule,
    RoleModule,
    PermissionModule,
    ProvinceModule,
    DistrictModule,
    WardModule,
    AddressModule,
    MediaModule,
    UserModule,
    ProductModule,
    CategoryModule,
    TagModule,
    CartModule,
    TableModule,
    DraftItemModule,
    ReservationModule,
    CouponModule,
    OrderModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: CustomZodValidationPipe
    },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    }
  ]
})
export class AppModule {}
