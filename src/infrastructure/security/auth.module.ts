import { Module } from '@nestjs/common';
import { AuthenticationHelper } from "./authentication.helper";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt.strategy";
import { JwtModule } from "@nestjs/jwt";
import { IAuthenticationHelperProvider } from "../../core/primary-ports/domain-services/authentication.helper.interface";

@Module({
  providers: [{provide: IAuthenticationHelperProvider, useClass: AuthenticationHelper}, PassportModule, JwtStrategy],
  exports: [IAuthenticationHelperProvider, JwtStrategy],
  imports: [PassportModule, JwtModule.register({signOptions: {expiresIn: '60d'}})]
})
export class AuthModule {}
