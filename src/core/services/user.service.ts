import { Injectable } from '@nestjs/common';
import { IUserService } from "../primary-ports/user.service.interface";
import { User } from "../models/user";
import { AuthenticationHelper } from "../../auth/authentication.helper";

@Injectable()
export class UserService implements IUserService{

  constructor(private authenticationHelper: AuthenticationHelper) {}

  generateHash(password: string, salt: string): string {
    throw 'To be implemented';
  }

  generateJWTToken(user: User): string {
    throw 'To be implemented';
  }

  generateSalt(): string {
    throw 'To be implemented';
  }

  login(username: string, password: string): Promise<User> {
    throw 'To be implemented';
  }

  verifyJWTToken(token: string): boolean {
    //return this.authenticationHelper
    return false;
  }
}
