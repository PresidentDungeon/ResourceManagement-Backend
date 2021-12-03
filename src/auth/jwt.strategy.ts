import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthenticationHelper } from './authentication.helper';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authenticationHelper: AuthenticationHelper) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: authenticationHelper.secretKey,
    });
  }

  async validate(payload: any) {
    return { userID: payload.ID, username: payload.username, role: payload.role, status: payload.status};
  }

}
