import { Injectable } from '@nestjs/common';
import { IUserService } from "../primary-ports/user.service.interface";
import { User } from "../models/user";
import { AuthenticationHelper } from "../../auth/authentication.helper";

@Injectable()
export class UserService implements IUserService{

  constructor(private authenticationHelper: AuthenticationHelper) {}

  generateSalt(): string {
    return this.authenticationHelper.generateSalt();
  }

  generateHash(password: string, salt: string): string {
    if(password == undefined || password == null || password.length == 0) {throw 'Password must be instantiated';}
    else if(salt == undefined || salt == null ||salt.length == 0) {throw 'Salt must be instantiated';}

    return this.authenticationHelper.generateHash(password, salt);
  }

  generateJWTToken(user: User): string {
    this.verifyUser(user);
    return this.authenticationHelper.generateJWTToken(user);
  }

  login(username: string, password: string): Promise<User> {
    throw 'To be implemented';
  }

  verifyJWTToken(token: string): boolean {
    //return this.authenticationHelper
    return false;
  }

  verifyUser(user: User) {
    if(user == undefined || user == null) {throw 'User must be instantiated';}
    if(user.ID == undefined || user.ID == null || user.ID <= 0){throw 'User must have a valid ID'}
    if(user.username == undefined || user.username == null || user.username.length <= 0){throw 'User must have a valid Username'}
    if(user.password == undefined || user.password == null || user.password.length <= 0){throw 'User must have a valid Password'}
    if(user.salt == undefined || user.salt == null || user.salt.length <= 0){throw 'An error occurred with Salt'}
    if(user.userRole == undefined || user.userRole == null || user.userRole.length <= 0){throw 'User must have a valid Role'}
  }
}
