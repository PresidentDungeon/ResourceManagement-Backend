import { Module } from "@nestjs/common";
import { AuthModule } from './auth/auth.module';
import { UserModule } from './api/user.module';
import { MailModule } from "./infrastructure/mail/mail.module";
import { DatabaseModule } from './infrastructure/data-source/postgres/database.module';
import { ConfigModule } from "@nestjs/config";
import { SocketModule } from "./api/socket.module";
import { ContractResumeModule } from "./api/contract.resume.module";
import * as Joi from '@hapi/joi';
import { WhitelistModule } from "./api/whitelist.module";

@Module({
  imports: [UserModule, ContractResumeModule, WhitelistModule, ConfigModule.forRoot({
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
      MOCK_API_URL: Joi.string().required(),
      EMAIL_USER: Joi.string().required(),
      EMAIL_PASS: Joi.string().required()
    })
  }), DatabaseModule, AuthModule, MailModule, SocketModule],
  controllers: [],
  providers: [],
  exports: []
})
export class AppModule {}
