import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ISocketService, ISocketServiceProvider } from '../../core/primary-ports/socket.service.interface';

@WebSocketGateway()
export class ManagementGateway implements OnGatewayInit, OnGatewayConnection{

  @WebSocketServer() server: Server;

  constructor(@Inject(ISocketServiceProvider) private socketService: ISocketService) {}

  afterInit(server: Server){
    this.socketService.setServer(server);
  }

  handleConnection(client: Socket, ...args: any[]): any {
    console.log('Ello');
  }

  handleDisconnect(client: Socket): any {
  }

}
