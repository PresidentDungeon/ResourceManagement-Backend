import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

  constructor(private reflector: Reflector) { super(); }

  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }

    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (roles != null || roles != undefined) {
      let index = roles.findIndex((data) => data.toLowerCase() == user.role.toLowerCase());

      if (index == -1) {
        throw new UnauthorizedException();
      }
    }

    return user;
  }
}







