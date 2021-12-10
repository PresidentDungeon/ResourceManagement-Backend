import { Inject, Injectable } from "@nestjs/common";
import { IUserService } from "../primary-ports/application-services/user.service.interface";
import { User } from "../models/user";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../../infrastructure/data-source/postgres/entities/user.entity";
import { Repository } from "typeorm";
import { PasswordTokenEntity } from "../../infrastructure/data-source/postgres/entities/password-token.entity";
import { PasswordToken } from "../models/password.token";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";
import { UserDTO } from "../../api/dtos/user.dto";
import { IRoleService, IRoleServiceProvider } from "../primary-ports/application-services/role.service.interface";
import { Role } from "../models/role";
import { Status } from "../models/status";
import { ConfirmationToken } from "../models/confirmation.token";
import { ConfirmationTokenEntity } from "../../infrastructure/data-source/postgres/entities/confirmation-token.entity";
import { IUserStatusService, IUserStatusServiceProvider } from "../primary-ports/application-services/user-status.service.interface";
import { IWhitelistService, IWhitelistServiceProvider } from "../primary-ports/application-services/whitelist.service.interface";
import { BadRequestError, EntityNotFoundError, InactiveError, InternalServerError } from "../../infrastructure/error-handling/errors";
import { IMailHelper, IMailHelperProvider, } from "../primary-ports/domain-services/mail.helper.interface";
import { IAuthenticationHelper, IAuthenticationHelperProvider } from "../primary-ports/domain-services/authentication.helper.interface";

@Injectable()
export class UserService implements IUserService {

  emailRegex: RegExp = new RegExp("^(([^<>()\\[\\]\\\\.,;:\\s@\"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@\"]+)*)|(\".+\"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$");
  saltLength: number = 16;
  passwordResetStringCount: number = 16;
  verificationTokenCount: number = 6;

  constructor(
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    @InjectRepository(PasswordTokenEntity) private passwordTokenRepository: Repository<PasswordTokenEntity>,
    @InjectRepository(ConfirmationTokenEntity) private confirmationTokenRepository: Repository<ConfirmationTokenEntity>,
    @Inject(IAuthenticationHelperProvider) private authenticationHelper: IAuthenticationHelper,
    @Inject(IMailHelperProvider) private mailHelper: IMailHelper,
    @Inject(IRoleServiceProvider) private roleService: IRoleService,
    @Inject(IUserStatusServiceProvider) private statusService: IUserStatusService,
    @Inject(IWhitelistServiceProvider) private whitelistService: IWhitelistService,
    ) {}

  async createUser(username: string, password: string): Promise<User> {

    if (username == null || !this.emailRegex.test(username)) {
      throw new BadRequestError("Username must be a valid email");
    }
    if (password == null || password.trim().length < 8) {
      throw new BadRequestError("Password must be minimum 8 characters long");
    }

    let userRole: Role = await this.roleService.findRoleByName("user");
    let userStatus: Status = await this.statusService.findStatusByName("pending");

    let salt: string = this.generateSalt();
    let hashedPassword: string = this.generateHash(password, salt);

    let [user, verificationCode] = await this.addUser({ ID: 0, username: username, password: hashedPassword, salt: salt, role: userRole, status: userStatus });
    this.mailHelper.sendUserConfirmation(username, verificationCode);
    return user;
  }

  async registerUser(username: string): Promise<User> {

    if (username == null || !this.emailRegex.test(username)) {
      throw new BadRequestError("Username must be a valid email");
    }

    let userRole: Role = await this.roleService.findRoleByName("user");
    let userStatus: Status = await this.statusService.findStatusByName("pending");

    let foundUser: User = await this.userRepository.createQueryBuilder("user")
      .andWhere(`user.username ILIKE :Username`, { Username: `${username}` }).getOne();

    if(foundUser){
      return foundUser
    }
    else{
      const [newUser, confirmationCode] = await this.addUser({ID: 0, username: username, password: '', salt: this.generateSalt(), status: userStatus, role: userRole});
      this.mailHelper.sendUserRegistrationInvite(username, confirmationCode);
      return newUser
    }
  }

  async addUser(user: User): Promise<[User, string]> {

    this.verifyUserEntity(user);
    const existingUsers = await this.userRepository.count({ where: `"username" ILIKE '${user.username}'` });

    if (existingUsers > 0) {
      throw new BadRequestError("User with the same name already exists");
    }

    const verificationCode = this.authenticationHelper.generateToken(this.verificationTokenCount);
    const tokenSalt = this.authenticationHelper.generateToken(this.saltLength);
    const hashedVerificationCode = this.generateHash(verificationCode, tokenSalt);

    const newUser = await this.userRepository.create(user);
    try {
      const savedUser = await this.userRepository.save(newUser);
      const confirmationToken: ConfirmationToken = {
        user: JSON.parse(JSON.stringify({ ID: savedUser.ID })),
        salt: tokenSalt,
        hashedConfirmationToken: hashedVerificationCode
      };
      await this.confirmationTokenRepository.save(confirmationToken);
      return [savedUser, verificationCode];
    }
    catch (e) {throw new InternalServerError("Error saving user to database");}
  }

  async getUserByUsername(username: string): Promise<User> {

    if (username == null || username == undefined || username.length <= 0) {
      throw new BadRequestError("Username must be instantiated or valid");
    }

    let qb = this.userRepository.createQueryBuilder("user");
    qb.leftJoinAndSelect("user.role", "role");
    qb.leftJoinAndSelect("user.status", "status");
    qb.andWhere(`user.username ILIKE :Username`, { Username: `${username}` });
    const foundUser: UserEntity = await qb.getOne();

    if (foundUser == null) {throw new EntityNotFoundError("No user registered with such a name");}
    return foundUser;
  }

  async getUsersByWhitelistDomain(domain: string): Promise<User[]> {
    if (domain == null || domain.trim().length <= 0) {
      throw new BadRequestError("Domain must be instantiated or valid");
    }

    let qb = this.userRepository.createQueryBuilder("user");
    qb.leftJoinAndSelect("user.role", "role");
    qb.leftJoinAndSelect("user.status", "status");
    qb.andWhere(`user.username ILIKE :domainName`, { domainName: `%${domain}` });
    const foundUsers: UserEntity[] = await qb.getMany();

    return foundUsers;
  }

  async getUserByID(ID: number): Promise<User> {

    if (ID == null || ID == undefined || ID <= 0) {
      throw new BadRequestError("User ID must be instantiated or valid");
    }

    let qb = this.userRepository.createQueryBuilder("user");
    qb.leftJoinAndSelect("user.role", "role");
    qb.leftJoinAndSelect("user.status", "status");
    qb.andWhere(`user.ID = :userID`, { userID: `${ID}` });
    const foundUser: UserEntity = await qb.getOne();

    if (foundUser == null) {throw new EntityNotFoundError("No user registered with such ID");}
    return foundUser;
  }

  async getUsers(filter: Filter): Promise<FilterList<UserDTO>> {

    if (filter == null || filter == undefined) {
      throw new BadRequestError("Invalid filter entered");
    }

    if (filter.itemsPrPage == null || filter.itemsPrPage == undefined || filter.itemsPrPage <= 0) {
      throw new BadRequestError("Invalid items pr. page entered");
    }

    if (filter.currentPage == null || filter.currentPage == undefined || filter.currentPage < 0) {
      throw new BadRequestError("Invalid current page entered");
    }

    let qb = this.userRepository.createQueryBuilder("user");
    qb.leftJoinAndSelect("user.role", "role");
    qb.leftJoinAndSelect("user.status", "status");

    if (filter.name != null && filter.name !== "") {
      qb.andWhere(`username ILIKE :name`, { name: `%${filter.name}%` });
    }

    if (filter.statusID != null && filter.statusID > 0) {
      qb.andWhere(`status.ID = :statusID`, { statusID: `${filter.statusID}` });
    }

    if (filter.roleID != null && filter.roleID > 0) {
      qb.andWhere(`role.ID = :roleID`, { roleID: `${filter.roleID}` });
    }

    if (filter.sorting != null && filter.sorting === "ASC" || filter.sorting != null && filter.sorting === "DESC") {
      if (filter.sortingType != null && filter.sortingType === "ALF") {
        qb.orderBy("user.username", filter.sorting);
      }
      if (filter.sortingType != null && filter.sortingType === "ADDED") {
        qb.orderBy("user.ID", filter.sorting);
      }
    }

    qb.offset((filter.currentPage) * filter.itemsPrPage);
    qb.limit(filter.itemsPrPage);

    const result = await qb.getMany();
    const count = await qb.getCount();

    const resultConverted: UserDTO[] = result.map((user) => {
      return { ID: user.ID, username: user.username, status: user.status, role: user.role };
    });

    const filterList: FilterList<UserDTO> = { list: resultConverted, totalItems: count };
    return filterList;
  }

  async getUsernames(username: string): Promise<string[]> {

    let limitCount = 5;

    let qb = this.userRepository.createQueryBuilder("user");

    qb.andWhere(`username ILIKE :userUsername`, { userUsername: `%${username}%` });
    qb.limit(limitCount);
    const result = await qb.getMany();
    return result.map((value) => {return value.username;});
  }

  async updateUser(userDTO: UserDTO): Promise<User> {

    const foundUser = await this.getUserByID(userDTO.ID);
    foundUser.ID = userDTO.ID;
    foundUser.username = userDTO.username;
    foundUser.status = userDTO.status;
    foundUser.role = userDTO.role;

    this.verifyUserEntity(foundUser);

    let updatedUser;

    try {
      updatedUser = await this.userRepository.save(foundUser);
      return updatedUser;
    }
    catch (e) {throw new InternalServerError("Internal server error during update of user");}
  }


  async login(username: string, password: string): Promise<User> {

    if (username == null || password == null) {
      throw new BadRequestError("Username or Password is non-existing");
    }

    let foundUser = await this.getUserByUsername(username);
    this.authenticationHelper.validateLogin(foundUser, password);

    if (foundUser.status.status.toLowerCase() == "disabled") {
      throw new BadRequestError("This user has been disabled");
    }

    if(foundUser.status.status.toLowerCase() == 'pending') {
      throw new InactiveError('Email has not been confirmed for this user. Please confirm this account before logging in.');
    }

    return foundUser;
  }

  async generateNewVerificationCode(user: User): Promise<string> {

    if (user.status.status.toLowerCase() != "pending") {
      throw new BadRequestError("This user has already been verified");
    }

    this.verifyUserEntity(user);
    const verificationCode = this.authenticationHelper.generateToken(this.verificationTokenCount);
    const saltValue = this.authenticationHelper.generateToken(this.saltLength);
    const hashedVerificationCode = this.authenticationHelper.generateHash(verificationCode, saltValue);
    const confirmationToken: ConfirmationToken = { user: user, salt: saltValue, hashedConfirmationToken: hashedVerificationCode };
    try {await this.confirmationTokenRepository.save(confirmationToken);}
    catch (e) {throw new InternalServerError("Error saving confirmation token to database");}
    this.mailHelper.sendUserConfirmation(user.username, verificationCode);
    return verificationCode;
  }

  async generatePasswordResetToken(username: string): Promise<string> {

    let user = await this.getUserByUsername(username);
    const passwordResetString = this.authenticationHelper.generateToken(this.passwordResetStringCount);
    const storedSalt = user.salt;
    const hashedPasswordResetString = this.authenticationHelper.generateHash(passwordResetString, storedSalt);

    try {
      const passwordToken: PasswordTokenEntity = { user: JSON.parse(JSON.stringify({ ID: user.ID })), hashedResetToken: hashedPasswordResetString };

      await this.passwordTokenRepository.createQueryBuilder().delete()
        .where("userID = :userID", { userID: `${user.ID}` })
        .execute();

      await this.passwordTokenRepository.save(passwordToken);
    }
    catch (e) {throw new InternalServerError("Error saving new password token to database");}
    this.mailHelper.sendUserPasswordReset(username, passwordResetString);
    return passwordResetString;
  }

  //Calling whitelist if confirm is correct -> calling correct find status by username
  async verifyUser(username: string, verificationCode: string) {

    let foundUser = await this.getUserByUsername(username);

    if (foundUser.status.status.toLowerCase() != "pending") {
      throw new BadRequestError("This user has already been verified");
    }

    await this.verifyUserConfirmationToken(foundUser, verificationCode);

    const isWhitelisted: boolean = await this.whitelistService.verifyUserWhitelist(foundUser.username);
    const userStatus: Status = (isWhitelisted) ? await this.statusService.findStatusByName('whitelisted') : await this.statusService.findStatusByName('active');

    foundUser.status = userStatus;

    try{
      await this.userRepository.save(foundUser);
      await this.deleteUserConfirmationToken(foundUser.ID);
    }
    catch (e) {throw new InternalServerError('Error verifying user')}
  }

  async verifyUserConfirmationToken(user: User, confirmationCode: string) {

    if (confirmationCode == null || confirmationCode == undefined || confirmationCode.length < this.verificationTokenCount) {
      throw new BadRequestError("Invalid verification code entered");
    }

    let qb = this.confirmationTokenRepository.createQueryBuilder("token");
    qb.leftJoinAndSelect("token.user", "user");
    qb.andWhere(`user.ID = :userID`, { userID: `${user.ID}` });

    const foundToken = await qb.getOne();

    if (foundToken == null) {
      throw new BadRequestError("Invalid verification code entered");
    }

    const hashedVerificationCode = this.generateHash(confirmationCode, foundToken.salt);

    if (foundToken.hashedConfirmationToken != hashedVerificationCode) {
      throw new BadRequestError("Invalid verification code entered");
    }
  }

  async verifyPasswordToken(user: User, passwordToken: string) {

    if (passwordToken == null || passwordToken == undefined || passwordToken.length < this.passwordResetStringCount) {
      throw new BadRequestError("Invalid password token entered");
    }

    const passwordResetHash = this.authenticationHelper.generateHash(passwordToken, user.salt);

    let qb = this.passwordTokenRepository.createQueryBuilder("passwordToken");
    qb.andWhere(`passwordToken.userID = :UserID`, { UserID: `${user.ID}` });
    qb.andWhere(`passwordToken.hashedResetToken = :PasswordToken`, { PasswordToken: `${passwordResetHash}` });

    const foundPasswordToken: PasswordToken = await qb.getOne();

    if (foundPasswordToken == null) {
      throw new BadRequestError("Wrong password token entered");
    }

    this.authenticationHelper.validatePasswordToken(foundPasswordToken);
  }

  async deleteUserConfirmationToken(userID: number) {

    if (userID == null || userID == undefined || userID <= 0) {
      throw new BadRequestError("User ID must be instantiated or valid");
    }

    try {
      await this.confirmationTokenRepository.createQueryBuilder()
        .delete()
        .where("userID = :userID", { userID: `${userID}` })
        .execute();
    }
    catch (e) {
      throw new InternalServerError("Error deleting user confirmation token");
    }
  }


  async updatePasswordWithConfirmationToken(username: string, confirmationToken: string, password: string): Promise<boolean> {

    let foundUser = await this.getUserByUsername(username);
    await this.verifyUserConfirmationToken(foundUser, confirmationToken);
    let result = await this.updatePassword(foundUser, password);
    await this.verifyUser(username, confirmationToken);
    return result;
  }

  async updatePasswordWithToken(username: string, passwordToken: string, password: string): Promise<boolean> {

    let foundUser = await this.getUserByUsername(username);
    await this.verifyPasswordToken(foundUser, passwordToken);
    const success = await this.updatePassword(foundUser, password);
    try {
      await this.passwordTokenRepository.createQueryBuilder().delete().from(PasswordTokenEntity).andWhere(`userID = :ID`, { ID: `${foundUser.ID}` }).execute();
    }
    catch (e) {
      throw new InternalServerError("Error updating password with password reset token");
    }
    this.mailHelper.sendUserPasswordResetConfirmation(username);
    return success;
  }

  async updatePasswordWithID(userID: number, password: string, oldPassword: string): Promise<boolean> {
    let foundUser = await this.getUserByID(userID);
    this.authenticationHelper.validateLogin(foundUser, oldPassword);
    return await this.updatePassword(foundUser, password);
  }

  async updatePassword(user: User, password: string): Promise<boolean> {

    if (password == null || password.length < 8) {
      throw new BadRequestError("Password must be minimum 8 characters long");
    }

    user.salt = this.authenticationHelper.generateToken(this.saltLength);
    user.password = this.authenticationHelper.generateHash(password, user.salt);

    try {await this.userRepository.save(user);}
    catch (e) {throw new InternalServerError("Error saving new password");}

    return true;
  }


  generateSalt(): string {
    return this.authenticationHelper.generateToken(this.saltLength);
  }

  generateHash(value: string, salt: string): string {
    if (value == undefined || value == null || value.length == 0) {throw new BadRequestError("Value to hash must be instantiated");}
    else if (salt == undefined || salt == null || salt.length == 0) {throw new BadRequestError("Salt must be instantiated");}

    return this.authenticationHelper.generateHash(value, salt);
  }

  generateJWTToken(user: User): string {
    this.verifyUserEntity(user);
    return this.authenticationHelper.generateJWTToken(user);
  }

  verifyJWTToken(token: string): boolean {
    if (token == undefined || token == null || token.length == 0) {throw new BadRequestError("Must enter a valid token");}
    return this.authenticationHelper.validateJWTToken(token);
  }


  verifyUserEntity(user: User) {
    if (user == undefined || user == null) {
      throw new BadRequestError("User must be instantiated");
    }
    if (user.ID == undefined || user.ID == null || user.ID < 0) {
      throw new BadRequestError("User must have a valid ID");
    }
    if (user.username == undefined || user.username == null || !this.emailRegex.test(user.username)) {
      throw new BadRequestError("User must have a valid Username");
    }
    if (user.salt == undefined || user.salt == null || user.salt.trim().length <= 0) {
      throw new BadRequestError("An error occurred with Salt");
    }
    if (user.role == undefined || user.role == null || user.role.ID <= 0) {
      throw new BadRequestError("An error occurred with user role");
    }
    if (user.status == undefined || user.status == null || user.status.ID <= 0) {
      throw new BadRequestError("An error occurred with user status");
    }
  }

  async getAllUserRoles(): Promise<Role[]> {
    return await this.roleService.getRoles();
  }

  async getAllStatuses(): Promise<Status[]> {
    return await this.statusService.getStatuses();
  }

}
