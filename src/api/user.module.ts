import { Module } from '@nestjs/common';
import { AuthModule } from "../auth/auth.module";
import { UserController } from "./controllers/user.controller";
import { IUserServiceProvider } from "../core/primary-ports/user.service.interface";
import { UserService } from "../core/services/user.service";

@Module({
  imports: [AuthModule],
  providers: [{provide: IUserServiceProvider, useClass: UserService}],
  controllers: [UserController],
  exports: [IUserServiceProvider]
})
export class UserModule {}
