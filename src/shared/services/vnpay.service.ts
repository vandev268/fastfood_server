import { Injectable } from '@nestjs/common'
import { dateFormat, HashAlgorithm, ignoreLogger, ProductCode, VNPay, VnpCurrCode, VnpLocale } from 'vnpay'
import envConfig from '../config'

@Injectable()
export class VNPayService {
  private vnpay: VNPay
  constructor() {
    this.vnpay = new VNPay({
      tmnCode: envConfig.VNPAY_TMN_CODE,
      secureSecret: envConfig.VNPAY_HASH_SECRET,
      vnpayHost: envConfig.VNPAY_URL, // URL của VNPAY
      testMode: true, // Chế độ test
      hashAlgorithm: HashAlgorithm.SHA512, // Thuật toán mã hóa
      loggerFn: ignoreLogger // Tắt logging
    })
  }

  generatePaymentUrl({ amount, orderInfo, txnRef }: { amount: number; orderInfo: string; txnRef?: string }) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const paymentUrl = this.vnpay.buildPaymentUrl({
      vnp_Amount: amount, // Số tiền thanh toán (ví dụ: 1 triệu đồng)
      vnp_IpAddr: '127.0.0.1',
      vnp_TxnRef: txnRef ? txnRef : orderInfo, // Mã giao dịch duy nhất
      vnp_OrderInfo: orderInfo, // Thông tin đơn hàng
      vnp_OrderType: ProductCode.Other, // Loại đơn hàng
      vnp_ReturnUrl: envConfig.VNPAY_REDIRECT_URL, // URL trả về sau
      vnp_Locale: VnpLocale.VN, // Ngôn ngữ hiển thị
      vnp_CurrCode: VnpCurrCode.VND, // Mã tiền tệ
      vnp_CreateDate: dateFormat(new Date()), // Ngày tạo giao dịch
      vnp_ExpireDate: dateFormat(tomorrow) // Ngày hết hạn giao
    })

    return paymentUrl
  }
}
