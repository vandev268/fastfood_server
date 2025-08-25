import { Injectable } from '@nestjs/common'
import { randomInt } from 'crypto'
import envConfig from '../config'
import { Resend } from 'resend'
import path from 'path'
import fs from 'fs'

@Injectable()
export class OtpService {
  private resend: Resend
  constructor() {
    this.resend = new Resend(envConfig.RESEND_OTP_SECRET_KEY)
  }

  generateOTP() {
    const otp = randomInt(0, 1000000)
    return otp.toString().padStart(6, '0')
  }

  async sendOTP({ to, subject, code }: { to: string; subject: string; code: string }) {
    const optTemplateFile = fs.readFileSync(path.resolve('src/shared/templates/otp-template.html'), 'utf-8')
    const optTemplate = optTemplateFile.replaceAll('{{code}}', code).replaceAll('{{subject}}', subject)
    return await this.resend.emails.send({
      from: 'no-reply@dinhvan.io.vn',
      to,
      subject,
      html: optTemplate
    })
  }
}
