import { Module } from "@nestjs/common";
import { AuthModule } from './auth/auth.module';
import { UserController } from './api/controllers/user.controller';
import { UserModule } from './api/user.module';
import { DatabaseModule } from './infrastructure/data-source/postgres/database.module';
import { ConfigModule } from "@nestjs/config";
import * as Joi from '@hapi/joi';
import { RoleModule } from "./api/role.module";
import { RoleService } from './core/services/role.service';

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
  }), DatabaseModule, AuthModule, RoleModule],
  controllers: [UserController],
  providers: [RoleService],
  exports: []
})
export class AppModule {}
