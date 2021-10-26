import { Injectable } from '@nestjs/common';
import { Hmac } from "crypto";
import { User } from "../core/models/user";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";

const crypto = require('crypto');
const saltLength = 16

@Injectable()
export class AuthenticationHelper {

  secretKey = this.generateSalt();

  constructor(private jwtService: JwtService) {}

  generateSalt(): string{
    return crypto.randomBytes(saltLength).toString('hex').slice(0, saltLength);
  }

  generateHash(password: string, salt: string): string{

    if(password == undefined || password == null || password.length == 0) {throw 'Password must be instantiated';}
    else if(salt == undefined || salt == null ||salt.length == 0) {throw 'Salt must be instantiated';}

    let hash: Hmac = crypto.createHmac('sha512', salt);
    hash.update(password);
    let value = hash.digest('hex');
    return value;
  }

  validateLogin(userToValidate: User, password: string): void{

    if(userToValidate == undefined || userToValidate == null) {throw 'User must be instantiated';}

    let hashedPassword: string = this.generateHash(password, userToValidate.salt);
    let storedPassword: string = userToValidate.password;

    if(storedPassword !== hashedPassword){
      throw new Error('Entered password is incorrect');
    }
  }

  generateJWTToken(user: User): string{

    if(user == undefined || user == null) {throw 'User must be instantiated';}

    const payload = {ID: user.ID, username: user.username, role: user.userRole};
    const options: JwtSignOptions = {secret: this.secretKey, algorithm: 'HS256'}
    return this.jwtService.sign(payload, options);
  }

  validateJWTToken(token: string): boolean{

    if(token == undefined || token == null || token.length == 0) {throw 'Must enter a valid token';}

    const options: JwtSignOptions = {secret: this.secretKey, algorithm: 'HS256'}
    this.jwtService.verify(token, options);
    return true;
  }

}
