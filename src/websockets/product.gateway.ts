import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Namespace, Room } from 'src/shared/constants/websocket.constant'

@WebSocketGateway({ namespace: Namespace.Product })
export class ProductGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  async handleConnection(client: Socket) {
    await client.join(Room.Product)
    console.log(`product-socket-con: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`product-socket-dis: ${client.id}`)
  }
}
