import { Injectable } from '@nestjs/common';
import { IUserService } from "../primary-ports/user.service.interface";
import { User } from "../models/user";

@Injectable()
export class UserService implements IUserService{

  generateHash(password: string, salt: string): string {
    return "";
  }

  generateJWTToken(user: User): string {
    return "";
  }

  generateSalt(): string {
    return "";
  }

  login(username: string, password: string): Promise<User> {
    return Promise.resolve(undefined);
  }

  verifyJWTToken(token: string): string {
    return "";
  }
}
