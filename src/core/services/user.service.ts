import { Injectable } from '@nestjs/common';
import { IUserService } from "../primary-ports/user.service.interface";
import { User } from "../models/user";
import { AuthenticationHelper } from "../../auth/authentication.helper";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../../infrastructure/data-source/postgres/entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UserService implements IUserService{

  constructor(private authenticationHelper: AuthenticationHelper, @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>) {}

  //Missing test
  createUser(username: string, password: string): User {

    if(username == null || username.length < 8 || username.length > 24){
      throw new Error('Username must be between 8-24 characters');
    }
    if(password == null || password.length < 8){
      throw new Error('Password must be minimum 8 characters long');
    }

    let salt: string = this.authenticationHelper.generateSalt();
    let hashedPassword: string = this.authenticationHelper.generateHash(password, salt);
    return {ID: 0, username: username, password: hashedPassword, salt: salt, role: null};
  }

  //Missing test
  async addUser(user: User): Promise<User> {

    const existingUsers = await this.userRepository.count({where: `"username" ILIKE '${user.username}`});

    if(existingUsers > 0)
    {
      throw 'User with the same name already exists';
    }

    //We need to create a validation code for registration
    const verificationCode = this.authenticationHelper.generateVerificationToken();
    user.authenticationCode = verificationCode;

    const newUser = await this.userRepository.create(user);
    await this.userRepository.save(newUser);
    return newUser;
  }




















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
    return this.authenticationHelper.validateJWTToken(token);
  }

  verifyUser(user: User) {
    if(user == undefined || user == null) {throw 'User must be instantiated';}
    if(user.ID == undefined || user.ID == null || user.ID <= 0){throw 'User must have a valid ID'}
    if(user.username == undefined || user.username == null || user.username.length <= 0){throw 'User must have a valid Username'}
    if(user.password == undefined || user.password == null || user.password.length <= 0){throw 'User must have a valid Password'}
    if(user.salt == undefined || user.salt == null || user.salt.length <= 0){throw 'An error occurred with Salt'}
  }
}
