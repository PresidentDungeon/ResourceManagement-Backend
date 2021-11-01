import { Injectable } from '@nestjs/common';
import { IUserService } from "../primary-ports/user.service.interface";
import { User } from "../models/user";
import { AuthenticationHelper } from "../../auth/authentication.helper";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity, UserStatus } from "../../infrastructure/data-source/postgres/entities/user.entity";
import { Repository } from "typeorm";
import { PasswordTokenEntity } from "../../infrastructure/data-source/postgres/entities/password-token.entity";
import { PasswordToken } from "../models/password.token";

@Injectable()
export class UserService implements IUserService{

  emailRegex: RegExp = new RegExp('^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');
  saltLength: number = 16;
  passwordResetStringCount: number = 16;
  verificationTokenCount: number = 6;

  constructor(private authenticationHelper: AuthenticationHelper, @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
              @InjectRepository(PasswordTokenEntity) private passwordTokenRepository: Repository<PasswordTokenEntity>) {}

  createUser(username: string, password: string): User {

    if(username == null || !this.emailRegex.test(username)){
      throw new Error('Username must be a valid email');
    }
    if(password == null || password.length < 8){
      throw new Error('Password must be minimum 8 characters long');
    }

    let salt: string = this.generateSalt();
    let hashedPassword: string = this.generateHash(password, salt);

    return {ID: 0, username: username, password: hashedPassword, salt: salt, role: null};
  }

  async addUser(user: User): Promise<string> {

    this.verifyUserEntity(user);
    const existingUsers = await this.userRepository.count({where: `"username" ILIKE '${user.username}'`});

    if(existingUsers > 0)
    {
      throw new Error('User with the same name already exists');
    }

    const verificationCode = this.authenticationHelper.generateToken(this.verificationTokenCount);
    const hashedVerificationCode = this.generateHash(verificationCode, user.salt);

    user.verificationCode = hashedVerificationCode;
    const newUser = await this.userRepository.create(user);
    await this.userRepository.save(newUser);
    return verificationCode;
  }

  async getUserByUsername(username: string): Promise<[User, string]>{

    if(username == null || username == undefined || username.length <= 0){
      throw new Error('Username must be instantiated or valid');
    }

    let qb = this.userRepository.createQueryBuilder("user");
    qb.leftJoinAndSelect('user.role', 'role');
    qb.andWhere(`user.username = :Username`, { Username: `${username}`});
    const foundUser: UserEntity = await qb.getOne();

    if(foundUser == null)
    {
      throw new Error('No user registered with such a name');
    }

    return [{ID: foundUser.ID, username: foundUser.username, password: foundUser.password, salt: foundUser.salt, role: foundUser.role, verificationCode: foundUser.verificationCode}, foundUser.status];
  }

  async verifyUser(username: string, verificationCode: string) {

    if(verificationCode == null || verificationCode == undefined || verificationCode.length < this.verificationTokenCount)
    {
      throw new Error('Invalid verification code entered');
    }

    let [foundUser, status] = await this.getUserByUsername(username);
    const hashedVerificationCode = this.generateHash(verificationCode, foundUser.salt);

    let qb = this.userRepository.createQueryBuilder("user");
    qb.andWhere(`user.username = :username`, { username: `${username}`});
    qb.andWhere(`user.verificationCode = :verificationCode`, { verificationCode: `${hashedVerificationCode}`});
    foundUser = await qb.getOne();

    if(foundUser == null)
    {
      throw new Error('Wrong verification code entered');
    }
    if(status != UserStatus.PENDING)
    {
      throw new Error('This user has already been verified');
    }

    qb = this.userRepository.createQueryBuilder("user");
    await qb.update()
      .set({status: 'active'})
      .where("ID = :ID", {ID: foundUser.ID})
      .execute();
  }

  generateSalt(): string {
    return this.authenticationHelper.generateToken(this.saltLength);
  }

  generateHash(value: string, salt: string): string {
    if(value == undefined || value == null || value.length == 0) {throw new Error('Value to hash must be instantiated');}
    else if(salt == undefined || salt == null ||salt.length == 0) {throw new Error('Salt must be instantiated');}

    return this.authenticationHelper.generateHash(value, salt);
  }

  generateJWTToken(user: User): string {
    this.verifyUserEntity(user);
    return this.authenticationHelper.generateJWTToken(user);
  }

  async generateNewVerificationCode(user: User, status: string): Promise<string>{

    if(status != UserStatus.PENDING){
      throw new Error('This user has already been verified');
    }

    this.verifyUserEntity(user);
    const verificationCode = this.authenticationHelper.generateToken(this.verificationTokenCount);
    const hashedVerificationCode = this.authenticationHelper.generateHash(verificationCode, user.salt);
    user.verificationCode = hashedVerificationCode;
    await this.userRepository.save(user);
    return verificationCode;
  }

  async login(username: string, password: string): Promise<[User, string]> {

    if(username == null || password == null){
      throw new Error('Username or Password is non-existing');
    }

    let [foundUser, status] = await this.getUserByUsername(username);

    this.authenticationHelper.validateLogin(foundUser, password);
    return [foundUser, status];
  }

  verifyJWTToken(token: string): boolean {
    if(token == undefined || token == null || token.length == 0) {throw new Error('Must enter a valid token');}
    return this.authenticationHelper.validateJWTToken(token);
  }

  verifyUserEntity(user: User) {
    if(user == undefined || user == null) {throw new Error('User must be instantiated');}
    if(user.ID == undefined || user.ID == null || user.ID < 0){throw new Error('User must have a valid ID')}
    if(user.username == undefined || user.username == null || user.username.length <= 0){throw new Error('User must have a valid Username');}
    if(user.password == undefined || user.password == null || user.password.length <= 0){throw new Error('User must have a valid Password');}
    if(user.salt == undefined || user.salt == null || user.salt.length <= 0){throw new Error('An error occurred with Salt');}
  }

  async generatePasswordResetToken(username: string): Promise<string>{

    let [user] = await this.getUserByUsername(username);
    const passwordResetString = this.authenticationHelper.generateToken(this.passwordResetStringCount);
    const storedSalt = user.salt;
    const hashedPasswordResetString = this.authenticationHelper.generateHash(passwordResetString, storedSalt);

    try{
      const passwordToken: PasswordTokenEntity = {user: JSON.parse(JSON.stringify({ID: user.ID})), hashedResetToken: hashedPasswordResetString};

      await this.passwordTokenRepository.createQueryBuilder().delete()
        .where("userID = :userID", { userID: `${user.ID}`})
        .execute();

      await this.passwordTokenRepository.save(passwordToken);
    }
    catch (e) {
      throw new Error('Internal server error. Please try again later.')
    }
    return passwordResetString;
  }

  async verifyPasswordToken(user: User, passwordToken: string){

    if(passwordToken == null || passwordToken == undefined || passwordToken.length < this.passwordResetStringCount)
    {
      throw new Error('Invalid password token entered');
    }

    const passwordResetHash = this.authenticationHelper.generateHash(passwordToken, user.salt);

    let qb = this.passwordTokenRepository.createQueryBuilder("passwordToken");
    qb.andWhere(`passwordToken.userID = :UserID`, { UserID: `${user.ID}`});
    qb.andWhere(`passwordToken.hashedResetToken = :PasswordToken`, { PasswordToken: `${passwordResetHash}`});

    const foundPasswordToken: PasswordToken = await qb.getOne();

    if(foundPasswordToken == null){
      throw new Error('Wrong password token entered');
    }

    this.authenticationHelper.validatePasswordToken(foundPasswordToken);
  }

  //Missing test
  async updatePassword(username: string, passwordToken: string, password: string){

    if(password == null || password == undefined || password.length < 8){
      throw new Error('Password must be minimum 8 characters long');
    }

    let [foundUser] = await this.getUserByUsername(username);
    await this.verifyPasswordToken(foundUser, passwordToken);

    foundUser.salt = this.authenticationHelper.generateToken(this.saltLength);
    foundUser.password = this.authenticationHelper.generateHash(password, foundUser.salt);

    const updatedUser = await this.userRepository.save(foundUser);

    if(updatedUser == null || updatedUser == undefined){throw new Error('Internal server error. Please try again later.')}
    return true;
  }

}
