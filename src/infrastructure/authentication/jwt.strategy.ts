import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from "@nestjs/common";
import { IAuthenticationHelper, IAuthenticationHelperProvider } from "../../core/primary-ports/domain-services/authentication.helper.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(IAuthenticationHelperProvider) private authenticationHelper: IAuthenticationHelper) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authenticationHelper.getSecretKey(),
    });
  }

  async validate(payload: any) {
    return { userID: payload.ID, username: payload.username, role: payload.role, status: payload.status};
  }

}
