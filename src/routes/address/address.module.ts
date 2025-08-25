import { Module } from '@nestjs/common'
import { AddressController } from './address.controller'
import { AddressService } from './address.service'
import { AddressRepo } from './address.repo'

@Module({
  controllers: [AddressController],
  providers: [AddressService, AddressRepo]
})
export class AddressModule {}
