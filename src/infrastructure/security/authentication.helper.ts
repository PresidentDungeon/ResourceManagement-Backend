import { Injectable } from '@nestjs/common';
import { Hmac } from "crypto";
import { User } from "../../core/models/user";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { PasswordToken } from "../../core/models/password.token";
import { BadRequestError } from "../error-handling/errors";
import { IAuthenticationHelper } from "../../core/primary-ports/domain-services/authentication.helper.interface";

const crypto = require('crypto');

@Injectable()
export class AuthenticationHelper implements IAuthenticationHelper{

  secretKeyLength: number = 16;
  maxPasswordTokenAgeInSeconds: number = 60 * 60 * 1000;
  secretKey: string = this.generateToken(this.secretKeyLength);

  constructor(private jwtService: JwtService) {}

  getSecretKey(): string{
    return this.secretKey;
  }

  generateToken(tokenLength: number): string{

    if(tokenLength == null || tokenLength <= 0 || !Number.isInteger(tokenLength)){
      throw new BadRequestError('Token length must be a positive numeric number')
    }

    return crypto.randomBytes(tokenLength).toString('hex').slice(0, tokenLength);
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
      throw new BadRequestError('Entered password is incorrect');
    }
  }

  generateJWT(user: User): string{
    const payload = {userID: user.ID, username: user.username, role: user.role.role, status: user.status.status};
    const options: JwtSignOptions = {secret: this.secretKey, algorithm: 'HS256'}
    return this.jwtService.sign(payload, options);
  }

  validateJWT(token: string): boolean{
    const options: JwtSignOptions = {secret: this.secretKey, algorithm: 'HS256'}
    this.jwtService.verify(token, options);
    return true;
  }

  validatePasswordToken(passwordToken: PasswordToken): boolean{

    const date: Date = new Date();

    if(date.getTime() - passwordToken.time.getTime() >= this.maxPasswordTokenAgeInSeconds){
      throw new BadRequestError('Password reset link has expired')
    }

    return true;
  }

}
