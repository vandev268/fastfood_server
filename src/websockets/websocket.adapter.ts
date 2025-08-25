import { HttpException, INestApplicationContext, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { ServerOptions, Socket } from 'socket.io'
import envConfig from 'src/shared/config'
import { generateRoomUserId } from 'src/shared/helpers'
import { SharedUserRepo } from 'src/shared/repositories/shared-user.repo'
import { TokenService } from 'src/shared/services/token.service'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import { Namespace, Room } from 'src/shared/constants/websocket.constant'
import { RoleName } from 'src/shared/constants/role.constant'

const NAMESPACES = [
  '/',
  Namespace.Order,
  Namespace.Product,
  Namespace.Category,
  Namespace.Tag,
  Namespace.Table,
  Namespace.Review
]

export class WebsocketAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>
  private readonly sharedUserRepo: SharedUserRepo
  private readonly tokenService: TokenService

  constructor(app: INestApplicationContext) {
    super(app)
    this.sharedUserRepo = app.get(SharedUserRepo)
    this.tokenService = app.get(TokenService)
  }

  async connectToRedis(): Promise<void> {
    try {
      const pubClient = createClient({ url: envConfig.REDIS_URL })
      const subClient = pubClient.duplicate()

      await Promise.all([pubClient.connect(), subClient.connect()])

      this.adapterConstructor = createAdapter(pubClient, subClient)
      console.log('Redis connected successfully')
    } catch {
      console.log('Redis connection failed')
    }
  }

  private async authMiddleware(socket: Socket, next: (err?: any) => void) {
    const accessToken = socket.handshake.auth['Authorization']?.split(' ')[1]
    if (!accessToken) {
      return next(new UnauthorizedException('Access token is required'))
    }
    try {
      const { userId } = await this.tokenService.verifyAccessToken(accessToken)
      const user = await this.sharedUserRepo.findUniqueWithRole({ id: userId })
      if (!user) {
        return next(new NotFoundException('User not found'))
      }
      // Nhiều thiết bị login 1 account thì sẽ có nhiều socketId và cùng 1 userId
      // Nên join vào cùng 1 room theo userId
      // Và không cần listen sự kiện disconnect để out khỏi room. Vì khi disconnect socket sẽ tự out khỏi tất cả room
      await socket.join(generateRoomUserId(user.id))
      if (user.role.name === RoleName.Admin || user.role.name === RoleName.Manager) {
        await socket.join(Room.Manage)
      }
      next()
    } catch (error) {
      if (error instanceof HttpException) {
        return next(error)
      }
      next(error)
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(Number(envConfig.SOCKET_IO_PORT || port), {
      ...options,
      cors: {
        origin: '*',
        credentials: true
      }
    })

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor)
    }

    // Chỉ có login mới được kết nối đến socket
    NAMESPACES.forEach((namespace) => {
      server.of(namespace).use((socket: Socket, next: (err?: any) => void) => {
        this.authMiddleware(socket, next).catch(() => {})
      })
    })

    return server
  }
}
