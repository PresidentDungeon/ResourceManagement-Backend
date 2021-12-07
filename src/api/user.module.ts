import { Module } from '@nestjs/common';
import { AuthModule } from "../auth/auth.module";
import { UserController } from "./controllers/user.controller";
import { IUserServiceProvider } from "../core/primary-ports/application-services/user.service.interface";
import { UserService } from "../core/services/user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../infrastructure/data-source/postgres/entities/user.entity";
import { MailModule } from "../infrastructure/mail/mail.module";
import { PasswordTokenEntity } from "../infrastructure/data-source/postgres/entities/password-token.entity";
import { SocketModule } from "./socket.module";
import { IRoleServiceProvider } from "../core/primary-ports/application-services/role.service.interface";
import { RoleService } from "../core/services/role.service";
import { IUserStatusServiceProvider } from "../core/primary-ports/application-services/user-status.service.interface";
import { UserStatusService } from "../core/services/user-status.service";
import { RoleEntity } from "../infrastructure/data-source/postgres/entities/role.entity";
import { UserStatusEntity } from "../infrastructure/data-source/postgres/entities/user-status.entity";
import { ConfirmationTokenEntity } from "../infrastructure/data-source/postgres/entities/confirmation-token.entity";
import { WhitelistModule } from "./whitelist.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ConfirmationTokenEntity, PasswordTokenEntity, RoleEntity, UserStatusEntity]), AuthModule, MailModule, SocketModule, WhitelistModule],
  providers: [
    {provide: IUserServiceProvider, useClass: UserService},
    {provide: IRoleServiceProvider, useClass: RoleService},
    {provide: IUserStatusServiceProvider, useClass: UserStatusService},
  ],
  controllers: [UserController],
  exports: [IUserServiceProvider, IRoleServiceProvider, IUserStatusServiceProvider]
})
export class UserModule {}
