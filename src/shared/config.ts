import { config } from 'dotenv'
import path from 'path'
import fs from 'fs'
import { z } from 'zod'

config({
  path: '.env'
})

if (!fs.existsSync(path.resolve('.env'))) {
  console.log('Environment file (.env) not found. Please create one with the necessary configurations.')
  process.exit(1)
}

const configSchema = z.object({
  DELETE_MODE: z.string(),
  CLIENT_REDIRECT_URI: z.string(),
  EMAIL_CLIENT_INIT: z.string(),
  PASSWORD_CLIENT_INIT: z.string(),
  JWT_ACCESS_TOKEN_SECRET: z.string(),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string(),
  JWT_REFRESH_TOKEN_SECRET: z.string(),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string(),
  RESEND_OTP_SECRET_KEY: z.string(),
  OTP_EXPIRES_IN: z.string(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string(),
  GOOGLE_CLIENT_REDIRECT_URI: z.string(),
  AWS_S3_BUCKET_NAME: z.string(),
  AWS_S3_REGION: z.string(),
  AWS_S3_ACCESS_KEY_ID: z.string(),
  AWS_S3_SECRET_KEY: z.string(),
  VNPAY_TMN_CODE: z.string(),
  VNPAY_HASH_SECRET: z.string(),
  VNPAY_URL: z.string(),
  VNPAY_REDIRECT_URL: z.string(),
  MOMO_ACCESS_KEY: z.string(),
  MOMO_SECRET_KEY: z.string(),
  MOMO_REDIRECT_URL: z.string(),
  ORDER_CANCEL_AFTER: z.string(),
  REDIS_URL: z.string()
})

const parsedConfig = configSchema.safeParse(process.env)
if (!parsedConfig.success) {
  console.error('Invalid environment variables:', parsedConfig.error.format())
  process.exit(1)
}

const envConfig = parsedConfig.data
export default envConfig
