import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Namespace, Room } from 'src/shared/constants/websocket.constant'

@WebSocketGateway({ namespace: Namespace.Tag })
export class TagGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  async handleConnection(client: Socket) {
    await client.join(Room.Tag)
    console.log(`tag-socket-con: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`tag-socket-dis: ${client.id}`)
  }
}
