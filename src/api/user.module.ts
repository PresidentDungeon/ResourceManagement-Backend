import { Module } from '@nestjs/common';
import { AuthModule } from "../auth/auth.module";
import { UserController } from "./controllers/user.controller";
import { IUserServiceProvider } from "../core/primary-ports/user.service.interface";
import { UserService } from "../core/services/user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../infrastructure/data-source/postgres/entities/user.entity";
import { MailModule } from "../infrastructure/mail/mail.module";
import { PasswordTokenEntity } from "../infrastructure/data-source/postgres/entities/password-token.entity";
import { SocketModule } from "./socket.module";
import { IRoleServiceProvider } from "../core/primary-ports/role.service.interface";
import { RoleService } from "../core/services/role.service";
import { IStatusServiceProvider } from "../core/primary-ports/status.service.interface";
import { StatusService } from "../core/services/status.service";
import { RoleEntity } from "../infrastructure/data-source/postgres/entities/role.entity";
import { StatusEntity } from "../infrastructure/data-source/postgres/entities/status.entity";
import { ConfirmationTokenEntity } from "../infrastructure/data-source/postgres/entities/confirmation-token.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ConfirmationTokenEntity, PasswordTokenEntity, RoleEntity, StatusEntity]), AuthModule, MailModule, SocketModule],
  providers: [
    {provide: IUserServiceProvider, useClass: UserService},
    {provide: IRoleServiceProvider, useClass: RoleService},
    {provide: IStatusServiceProvider, useClass: StatusService}
  ],
  controllers: [UserController],
  exports: [IUserServiceProvider, IRoleServiceProvider, IStatusServiceProvider]
})
export class UserModule {}
