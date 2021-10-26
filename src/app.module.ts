import { Module } from "@nestjs/common";
import { AuthenticationHelper } from './auth/authentication.helper';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [],
  providers: [AuthenticationHelper],
})
export class AppModule {}
