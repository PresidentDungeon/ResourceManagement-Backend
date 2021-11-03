import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoleEntity } from "../infrastructure/data-source/postgres/entities/role.entity";
import { IRoleServiceProvider } from "../core/primary-ports/role.service.interface";
import { RoleService } from "../core/services/role.service";
import { RoleController } from "./controllers/role.controller";
import { ManagementGateway } from './gateways/management.gateway';
import { SocketModule } from './socket.module';

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity]), SocketModule],
  providers: [{provide: IRoleServiceProvider, useClass: RoleService}, ManagementGateway],
  controllers: [RoleController],
  exports: [IRoleServiceProvider]
})

export class RoleModule {}
