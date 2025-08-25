import { createZodDto } from 'nestjs-zod'
import {
  GetPaymentLinkBodySchema,
  GetPaymentLinkResSchema,
  MomoPaymentCallbackQuerySchema,
  VNPayPaymentCallbackQuerySchema,
  CreateDineInPaymentBodySchema,
  CreateDineInPaymentResSchema,
  CompleteDineInOrderBodySchema,
  CompleteDineInOrderResSchema
} from './payment.model'

export class GetPaymentLinkBodyDTO extends createZodDto(GetPaymentLinkBodySchema) {}
export class GetPaymentLinkResDTO extends createZodDto(GetPaymentLinkResSchema) {}
export class VNPayPaymentCallbackQueryDTO extends createZodDto(VNPayPaymentCallbackQuerySchema) {}
export class MomoPaymentCallbackQueryDTO extends createZodDto(MomoPaymentCallbackQuerySchema) {}
export class CreateDineInPaymentBodyDTO extends createZodDto(CreateDineInPaymentBodySchema) {}
export class CreateDineInPaymentResDTO extends createZodDto(CreateDineInPaymentResSchema) {}
export class CompleteDineInOrderBodyDTO extends createZodDto(CompleteDineInOrderBodySchema) {}
export class CompleteDineInOrderResDTO extends createZodDto(CompleteDineInOrderResSchema) {}
