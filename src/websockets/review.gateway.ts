import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Namespace, Room } from 'src/shared/constants/websocket.constant'

@WebSocketGateway({ namespace: Namespace.Review })
export class ReviewGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  async handleConnection(client: Socket) {
    await client.join(Room.Review)
    console.log(`review-socket-con: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`review-socket-dis: ${client.id}`)
  }
}
