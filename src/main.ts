import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { config } from 'dotenv'
import { WebsocketAdapter } from './websockets/websocket.adapter'

config()

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.enableCors()

  const websocketAdapter = new WebsocketAdapter(app)
  await websocketAdapter.connectToRedis().catch(() => {})
  app.useWebSocketAdapter(websocketAdapter)

  await app.listen(process.env.PORT ?? 4000)
}

bootstrap()
