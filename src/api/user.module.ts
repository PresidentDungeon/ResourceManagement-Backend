import { Module } from '@nestjs/common';
import { AuthModule } from "../auth/auth.module";
import { UserController } from "./controllers/user.controller";
import { IUserServiceProvider } from "../core/primary-ports/user.service.interface";
import { UserService } from "../core/services/user.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "../infrastructure/data-source/postgres/entities/user.entity";
import { RoleModule } from './role.module';
import { MailModule } from "../infrastructure/mail/mail.module";
import { PasswordTokenEntity } from "../infrastructure/data-source/postgres/entities/password-token.entity";

@Module({
  imports: [AuthModule, RoleModule, MailModule, TypeOrmModule.forFeature([UserEntity, PasswordTokenEntity])],
  providers: [{provide: IUserServiceProvider, useClass: UserService}],
  controllers: [UserController],
  exports: [IUserServiceProvider]
})
export class UserModule {}
