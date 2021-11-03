import { Module } from '@nestjs/common';
import { ISocketServiceProvider } from '../core/primary-ports/socket.service.interface';
import { ManagementGateway } from "./gateways/management.gateway";
import { SocketService } from "../core/services/socket.service";

@Module({
  imports: [],
  controllers: [],
  providers: [{provide: ISocketServiceProvider, useClass: SocketService}, ManagementGateway],
  exports: [ISocketServiceProvider]
})
export class SocketModule {}
