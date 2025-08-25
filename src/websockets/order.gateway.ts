import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Namespace } from 'src/shared/constants/websocket.constant'

@WebSocketGateway({ namespace: Namespace.Order })
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  handleConnection(client: Socket) {
    console.log(`order-socket-con: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`order-socket-dis: ${client.id}`)
  }
}
