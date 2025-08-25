import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { Namespace, Room } from 'src/shared/constants/websocket.constant'

@WebSocketGateway({ namespace: Namespace.Reservation })
export class ReservationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  async handleConnection(client: Socket) {
    await client.join(Room.Reservation)
    console.log(`reservation-socket-con: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    console.log(`reservation-socket-dis: ${client.id}`)
  }
}
