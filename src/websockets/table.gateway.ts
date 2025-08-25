import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Namespace, Room } from 'src/shared/constants/websocket.constant'

@WebSocketGateway({ namespace: Namespace.Table })
export class TableGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  async handleConnection(client: Socket) {
    await client.join(Room.Table)
    console.log(`table-socket-con: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`table-socket-dis: ${client.id}`)
  }
}
