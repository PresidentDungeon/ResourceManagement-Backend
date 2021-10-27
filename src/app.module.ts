import { Module } from '@nestjs/common';
import { DatabaseModule } from './infrastructure/data-source/postgres/database.module';
import { ConfigModule } from "@nestjs/config";
import * as Joi from '@hapi/joi';
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserEntity } from "./infrastructure/data-source/postgres/entities/user.entity";

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot({
    validationSchema: Joi.object({
      POSTGRES_HOST: Joi.string().required(),
      POSTGRES_PORT: Joi.number().required(),
      POSTGRES_USER: Joi.string().required(),
      POSTGRES_PASSWORD: Joi.string().required(),
      POSTGRES_DB: Joi.string().required(),
      PORT: Joi.number(),
    })
  }), TypeOrmModule.forFeature([UserEntity])],
  controllers: [],
  providers: [],
  exports: []
})
export class AppModule {}
