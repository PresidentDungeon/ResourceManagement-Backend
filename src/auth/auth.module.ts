import { Module } from '@nestjs/common';
import { AuthenticationHelper } from "./authentication.helper";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt.strategy";
import { JwtModule } from "@nestjs/jwt";

@Module({
  providers: [AuthenticationHelper, PassportModule, JwtStrategy],
  exports: [AuthenticationHelper, JwtStrategy],
  imports: [PassportModule, JwtModule.register({signOptions: {expiresIn: '60d'}})]
})
export class AuthModule {}
