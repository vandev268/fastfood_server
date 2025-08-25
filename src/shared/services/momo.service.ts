import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import * as crypto from 'crypto'
import envConfig from '../config'

type MomoPaymentRes = {
  partnerCode: string
  orderId: string
  requestId: string
  amount: number
  responseTime: number
  message: string
  resultCode: number
  payUrl: string
  shortLink: string
  [key: string]: any
}

@Injectable()
export class MomoService {
  constructor(private readonly httpService: HttpService) {}

  async generatePaymentUrl(data: { orderInfo: string; amount: string }) {
    const accessKey = envConfig.MOMO_ACCESS_KEY
    const secretKey = envConfig.MOMO_SECRET_KEY
    const partnerCode = 'MOMO'
    const requestType = 'payWithMethod'
    const orderId = partnerCode + new Date().getTime()
    const requestId = orderId
    const extraData = ''
    const orderGroupId = ''
    const autoCapture = true
    const lang = 'vi'

    // Create raw signature
    const rawSignature = `accessKey=${accessKey}&amount=${data.amount}&extraData=${extraData}&ipnUrl=${envConfig.MOMO_REDIRECT_URL}&orderId=${orderId}&orderInfo=${data.orderInfo}&partnerCode=${partnerCode}&redirectUrl=${envConfig.MOMO_REDIRECT_URL}&requestId=${requestId}&requestType=${requestType}`

    // Generate signature
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex')

    // Prepare request body
    const requestBody = {
      partnerCode,
      partnerName: 'Test',
      storeId: 'MomoTestStore',
      requestId,
      amount: data.amount,
      orderId,
      orderInfo: data.orderInfo,
      redirectUrl: envConfig.MOMO_REDIRECT_URL,
      ipnUrl: envConfig.MOMO_REDIRECT_URL,
      lang,
      requestType,
      autoCapture,
      extraData,
      orderGroupId,
      signature
    }

    try {
      // Send request to MoMo API
      const response = await firstValueFrom(
        this.httpService.post<MomoPaymentRes>('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      )

      return response.data
    } catch (error) {
      throw new Error(`Problem with MoMo request: ${error.message}`)
    }
  }
}
