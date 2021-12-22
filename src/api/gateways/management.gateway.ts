import { OnGatewayConnection, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ISocketService, ISocketServiceProvider } from '../../core/primary-ports/application-services/socket.service.interface';

@WebSocketGateway()
export class ManagementGateway implements OnGatewayInit, OnGatewayConnection{

  @WebSocketServer() server: Server;

  constructor(@Inject(ISocketServiceProvider) private socketService: ISocketService) {}

  afterInit(server: Server){this.socketService.setServer(server);}
  handleConnection(client: Socket, ...args: any[]): any {}
  handleDisconnect(client: Socket): any {}

}
