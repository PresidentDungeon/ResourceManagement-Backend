import { Module } from "@nestjs/common";
import { AuthModule } from './auth/auth.module';
import { UserModule } from './api/user.module';
import { RoleModule } from "./api/role.module";
import { MailModule } from "./infrastructure/mail/mail.module";
import { DatabaseModule } from './infrastructure/data-source/postgres/database.module';
import { ConfigModule } from "@nestjs/config";
import { SocketModule } from "./api/socket.module";

import { UserController } from './api/controllers/user.controller';
import { RoleController } from './api/controllers/role.controller';
import * as Joi from '@hapi/joi';

@Module({
  imports: [UserModule, ConfigModule.forRoot({
    envFilePath: '.dev.env',
    isGlobal: true,
    validationSchema: Joi.object({
      POSTGRES_HOST: Joi.string().required(),
      POSTGRES_PORT: Joi.number().required(),
      POSTGRES_USER: Joi.string().required(),
      POSTGRES_PASSWORD: Joi.string().required(),
      POSTGRES_DB: Joi.string().required(),
      PORT: Joi.number(),
      FRONTEND_ROUTE: Joi.string().required(),
      EMAIL_USER: Joi.string().required(),
      EMAIL_PASS: Joi.string().required()
    })
  }), DatabaseModule, AuthModule, RoleModule, MailModule, SocketModule],
  controllers: [UserController, RoleController],
  providers: [],
  exports: []
})
export class AppModule {}
