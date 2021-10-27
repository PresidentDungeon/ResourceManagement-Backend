import { Injectable } from '@nestjs/common';
import { Hmac } from "crypto";
import { User } from "../core/models/user";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";

const crypto = require('crypto');
const saltLength = 16
const veriLength = 6;

@Injectable()
export class AuthenticationHelper {

  secretKey = this.generateSalt();

  constructor(private jwtService: JwtService) {}

  generateSalt(): string{
    return crypto.randomBytes(saltLength).toString('hex').slice(0, saltLength);
  }

  generateHash(password: string, salt: string): string{
    let hash: Hmac = crypto.createHmac('sha512', salt);
    hash.update(password);
    let value = hash.digest('hex');
    return value;
  }

  validateLogin(userToValidate: User, password: string): void{

    let hashedPassword: string = this.generateHash(password, userToValidate.salt);
    let storedPassword: string = userToValidate.password;

    if(storedPassword !== hashedPassword){
      throw new Error('Entered password is incorrect');
    }
  }

  generateJWTToken(user: User): string{
    const payload = {ID: user.ID, username: user.username, role: user.role.role};
    const options: JwtSignOptions = {secret: this.secretKey, algorithm: 'HS256'}
    return this.jwtService.sign(payload, options);
  }

  //missing test
  generateVerificationToken(): string{
    return crypto.randomBytes(veriLength).toString('hex').slice(0, veriLength);
  }

  validateJWTToken(token: string): boolean{

    if(token == undefined || token == null || token.length == 0) {throw 'Must enter a valid token';}

    const options: JwtSignOptions = {secret: this.secretKey, algorithm: 'HS256'}
    this.jwtService.verify(token, options);
    return true;
  }
}
