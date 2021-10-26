import { Module } from "@nestjs/common";
import { AuthenticationHelper } from './auth/authentication.helper';
import { AuthModule } from './auth/auth.module';
import { UserController } from './api/controllers/user.controller';
import { UserModule } from './api/user.module';
import { UserService } from './core/services/user.service';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [UserController],
  providers: [AuthenticationHelper, UserService],
})
export class AppModule {}
