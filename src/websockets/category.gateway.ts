import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Namespace, Room } from 'src/shared/constants/websocket.constant'

@WebSocketGateway({ namespace: Namespace.Category })
export class CategoryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  async handleConnection(client: Socket) {
    await client.join(Room.Category)
    console.log(`category-socket-con: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`category-socket-dis: ${client.id}`)
  }
}
