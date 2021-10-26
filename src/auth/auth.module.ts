import { Module } from '@nestjs/common';
import { AuthenticationHelper } from "./authentication.helper";

@Module({
  providers: [],
  exports: [AuthenticationHelper],
  imports: []
})
export class AuthModule {}
