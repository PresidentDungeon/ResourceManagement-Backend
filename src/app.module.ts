import { Module } from "@nestjs/common";
import { AuthenticationHelper } from './auth/authentication.helper';
import { AuthModule } from './auth/auth.module';
import { UserController } from './api/controllers/user.controller';
import { UserModule } from './api/user.module';
import { UserService } from './core/services/user.service';
import { DatabaseModule } from './infrastructure/data-source/postgres/database.module';
import { ConfigModule } from "@nestjs/config";
import * as Joi from '@hapi/joi';
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./infrastructure/data-source/postgres/entities/user.entity";

@Module({
  imports: [UserModule, ConfigModule.forRoot({
    validationSchema: Joi.object({
      POSTGRES_HOST: Joi.string().required(),
      POSTGRES_PORT: Joi.number().required(),
      POSTGRES_USER: Joi.string().required(),
      POSTGRES_PASSWORD: Joi.string().required(),
      POSTGRES_DB: Joi.string().required(),
      PORT: Joi.number(),
    })
  }), DatabaseModule, AuthModule],
  controllers: [UserController],
  providers: [],
  exports: []
})
export class AppModule {}
