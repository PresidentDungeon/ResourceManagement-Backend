import { Injectable } from '@nestjs/common';
import { IUserService } from "../primary-ports/user.service.interface";
import { User } from "../models/user";
import { AuthenticationHelper } from "../../auth/authentication.helper";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../../infrastructure/data-source/postgres/entities/user.entity";
import { Repository } from "typeorm";
import any = jasmine.any;

@Injectable()
export class UserService implements IUserService{

  constructor(private authenticationHelper: AuthenticationHelper, @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>) {}

  createUser(username: string, password: string): User {

    if(username == null || username.length < 8 || username.length > 60){
      throw new Error('Username must be between 8-60 characters');
    }
    if(password == null || password.length < 8){
      throw new Error('Password must be minimum 8 characters long');
    }

    let salt: string = this.authenticationHelper.generateSalt();
    let hashedPassword: string = this.authenticationHelper.generateHash(password, salt);

    return {ID: 0, username: username, password: hashedPassword, salt: salt, role: null};
  }

  async addUser(user: User): Promise<User> {

    this.verifyUser(user);
    const existingUsers = await this.userRepository.count({where: `"username" ILIKE '${user.username}'`});

    if(existingUsers > 0)
    {
      throw new Error('User with the same name already exists');
    }

    const verificationCode = this.authenticationHelper.generateVerificationToken();
    user.verificationCode = verificationCode;
    const newUser = await this.userRepository.create(user);
    await this.userRepository.save(newUser);
    return newUser;
  }

  generateSalt(): string {
    return this.authenticationHelper.generateSalt();
  }

  generateHash(password: string, salt: string): string {
    if(password == undefined || password == null || password.length == 0) {throw new Error('Password must be instantiated');}
    else if(salt == undefined || salt == null ||salt.length == 0) {throw new Error('Salt must be instantiated');}

    return this.authenticationHelper.generateHash(password, salt);
  }

  generateJWTToken(user: User): string {
    this.verifyUser(user);
    return this.authenticationHelper.generateJWTToken(user);
  }

  //Missing test
  async login(username: string, password: string): Promise<[User, string]> {
    throw new Error ('To Be Implemented');
  }

  verifyJWTToken(token: string): boolean {
    return this.authenticationHelper.validateJWTToken(token);
  }

  verifyUser(user: User) {
    if(user == undefined || user == null) {throw new Error('User must be instantiated');}
    if(user.ID == undefined || user.ID == null || user.ID < 0){throw new Error('User must have a valid ID')}
    if(user.username == undefined || user.username == null || user.username.length <= 0){throw new Error('User must have a valid Username');}
    if(user.password == undefined || user.password == null || user.password.length <= 0){throw new Error('User must have a valid Password');}
    if(user.salt == undefined || user.salt == null || user.salt.length <= 0){throw new Error('An error occurred with Salt');}
  }
}
