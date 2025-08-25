import { z } from 'zod'

export const GetPaymentLinkBodySchema = z
  .object({
    orderId: z.number()
  })
  .strict()

export const GetPaymentLinkResSchema = z.object({
  url: z.string()
})

export const VNPayPaymentCallbackQuerySchema = z.object({
  vnp_Amount: z.string(),
  vnp_BankCode: z.string(),
  vnp_BankTranNo: z.string(),
  vnp_CardType: z.string(),
  vnp_OrderInfo: z.string(),
  vnp_PayDate: z.string(),
  vnp_ResponseCode: z.string(),
  vnp_TmnCode: z.string(),
  vnp_TransactionNo: z.string(),
  vnp_TransactionStatus: z.string(),
  vnp_TxnRef: z.string(),
  vnp_SecureHash: z.string()
})

// export const MomoPaymentCallbackQuery1Schema = z.object({
//   message: z.string(),
//   data: z.object({
//     partnerCode: z.string(),
//     orderId: z.string(),
//     requestId: z.string(),
//     amount: z.string(),
//     orderInfo: z.string(),
//     orderType: z.string(),
//     transId: z.string(),
//     resultCode: z.string(),
//     message: z.string(),
//     payType: z.string(),
//     responseTime: z.string(),
//     extraData: z.string(),
//     signature: z.string()
//   })
// })

export const MomoPaymentCallbackQuerySchema = z.object({
  partnerCode: z.string(),
  orderId: z.string(),
  requestId: z.string(),
  amount: z.string(),
  orderInfo: z.string(),
  orderType: z.string(),
  transId: z.string(),
  resultCode: z.string(),
  message: z.string(),
  payType: z.string(),
  responseTime: z.string(),
  extraData: z.string(),
  signature: z.string()
})

// Schemas for dine-in payment APIs
export const CreateDineInPaymentBodySchema = z
  .object({
    draftOrderId: z.string(),
    paymentMethod: z.enum(['CASH', 'MOMO', 'VNPAY']),
    amount: z.number(),
    customerPaid: z.number().optional()
  })
  .strict()

export const CreateDineInPaymentResSchema = z.object({
  message: z.string(),
  data: z
    .object({
      paymentId: z.string(),
      remainingAmount: z.number()
    })
    .optional()
})

export const CompleteDineInOrderBodySchema = z
  .object({
    draftOrderId: z.string(),
    tableNumber: z.number()
  })
  .strict()

export const CompleteDineInOrderResSchema = z.object({
  message: z.string(),
  data: z
    .object({
      orderId: z.number()
    })
    .optional()
})

export type GetPaymentLinkBodyType = z.infer<typeof GetPaymentLinkBodySchema>
export type GetPaymentLinkResType = z.infer<typeof GetPaymentLinkResSchema>
export type VNPayPaymentCallbackQueryType = z.infer<typeof VNPayPaymentCallbackQuerySchema>
export type MomoPaymentCallbackQueryType = z.infer<typeof MomoPaymentCallbackQuerySchema>
export type CreateDineInPaymentBodyType = z.infer<typeof CreateDineInPaymentBodySchema>
export type CreateDineInPaymentResType = z.infer<typeof CreateDineInPaymentResSchema>
export type CompleteDineInOrderBodyType = z.infer<typeof CompleteDineInOrderBodySchema>
export type CompleteDineInOrderResType = z.infer<typeof CompleteDineInOrderResSchema>
