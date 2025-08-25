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
  GOOGLE_CLIENT_REDIRECT_URI: z.string()
})

const parsedConfig = configSchema.safeParse(process.env)
if (!parsedConfig.success) {
  console.error('Invalid environment variables:', parsedConfig.error.format())
  process.exit(1)
}

const envConfig = parsedConfig.data
export default envConfig
