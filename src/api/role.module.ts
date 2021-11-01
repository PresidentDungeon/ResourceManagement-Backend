import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoleEntity } from "../infrastructure/data-source/postgres/entities/role.entity";
import { IRoleServiceProvider } from "../core/primary-ports/role.service.interface";
import { RoleService } from "../core/services/role.service";
import { AuthModule } from "../auth/auth.module";
import { MailModule } from '../infrastructure/mail/mail.module';
import { PasswordTokenEntity } from "../infrastructure/data-source/postgres/entities/password-token.entity";

@Module({
  imports: [TypeOrmModule.forFeature([RoleEntity])],
  providers: [{provide: IRoleServiceProvider, useClass: RoleService}],
  controllers: [],
  exports: [IRoleServiceProvider]
})

export class RoleModule {}
