import { Inject, Injectable } from "@nestjs/common";
import { IUserService } from "../primary-ports/user.service.interface";
import { User } from "../models/user";
import { AuthenticationHelper } from "../../auth/authentication.helper";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../../infrastructure/data-source/postgres/entities/user.entity";
import { Repository } from "typeorm";
import { PasswordTokenEntity } from "../../infrastructure/data-source/postgres/entities/password-token.entity";
import { PasswordToken } from "../models/password.token";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";
import { UserDTO } from "../../api/dtos/user.dto";
import { IRoleService, IRoleServiceProvider } from "../primary-ports/role.service.interface";
import { IStatusService, IStatusServiceProvider } from "../primary-ports/status.service.interface";
import { Role } from "../models/role";
import { Status } from "../models/status";

@Injectable()
export class UserService implements IUserService{

  emailRegex: RegExp = new RegExp('^(([^<>()\\[\\]\\\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\\\.,;:\\s@"]+)*)|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');
  saltLength: number = 16;
  passwordResetStringCount: number = 16;
  verificationTokenCount: number = 6;

  constructor(
    private authenticationHelper: AuthenticationHelper,
    @InjectRepository(UserEntity) private userRepository: Repository<UserEntity>,
    @InjectRepository(PasswordTokenEntity) private passwordTokenRepository: Repository<PasswordTokenEntity>,
    @Inject(IRoleServiceProvider) private roleService: IRoleService,
    @Inject(IStatusServiceProvider) private statusService: IStatusService
  ) {}

  async createUser(username: string, password: string): Promise<User> {

    if(username == null || !this.emailRegex.test(username)){
      throw new Error('Username must be a valid email');
    }
    if(password == null || password.length < 8){
      throw new Error('Password must be minimum 8 characters long');
    }

    let userRole: Role = await this.roleService.findRoleByName('user');
    let userStatus: Status = await this.statusService.findStatusByName('pending');

    let salt: string = this.generateSalt();
    let hashedPassword: string = this.generateHash(password, salt);

    return {ID: 0, username: username, password: hashedPassword, salt: salt, role: userRole, status: userStatus};
  }

  async addUser(user: User): Promise<[User, string]> {

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

    try{
      const savedUser = await this.userRepository.save(newUser);;
      return [savedUser, verificationCode];
    }
    catch (e) {throw new Error('Internal server error')}

  }

  async getUserByUsername(username: string): Promise<User>{

    if(username == null || username == undefined || username.length <= 0){
      throw new Error('Username must be instantiated or valid');
    }

    let qb = this.userRepository.createQueryBuilder("user");
    qb.leftJoinAndSelect('user.role', 'role');
    qb.leftJoinAndSelect('user.status', 'status');
    qb.andWhere(`user.username = :Username`, { Username: `${username}`});
    const foundUser: UserEntity = await qb.getOne();

    if(foundUser == null)
    {
      throw new Error('No user registered with such a name');
    }

    return foundUser;
  }

  //Missing test
  async getUserByID(ID: number): Promise<User>{

    if(ID == null || ID == undefined || ID <= 0){
      throw new Error('User ID must be instantiated or valid');
    }

    let qb = this.userRepository.createQueryBuilder("user");
    qb.leftJoinAndSelect('user.role', 'role');
    qb.leftJoinAndSelect('user.status', 'status');
    qb.andWhere(`user.ID = :userID`, { userID: `${ID}`});
    const foundUser: UserEntity = await qb.getOne();

    if(foundUser == null)
    {
      throw new Error('No user registered with such ID');
    }

    return foundUser;
  }

  async getUsers(filter: Filter): Promise<FilterList<UserDTO>> {

    if(filter == null || filter == undefined){
      throw new Error('Invalid filter entered');
    }

    if(filter.itemsPrPage == null || filter.itemsPrPage == undefined || filter.itemsPrPage <= 0){
      throw new Error('Invalid items pr. page entered');
    }

    if(filter.currentPage == null || filter.currentPage == undefined || filter.currentPage < 0){
      throw new Error('Invalid current page entered');
    }

    let qb = this.userRepository.createQueryBuilder("user");
    qb.leftJoinAndSelect('user.role', 'role');
    qb.leftJoinAndSelect('user.status', 'status');

    if(filter.name != null && filter.name !== '')
    {
      qb.andWhere(`username ILIKE :name`, { name: `%${filter.name}%` });
    }

    if(filter.statusID != null && filter.statusID > 0)
    {
      qb.andWhere(`status.ID = :statusID`, { statusID: `${filter.statusID}` });
    }

    if(filter.roleID != null && filter.roleID > 0)
    {
      qb.andWhere(`role.ID = :roleID`, { roleID: `${filter.roleID}` });
    }

    if(filter.sorting != null && filter.sorting === 'ASC' || filter.sorting != null && filter.sorting === 'DESC')
    {
      if(filter.sortingType != null && filter.sortingType === 'ALF')
      {
        qb.orderBy('user.username', filter.sorting);
      }
      if(filter.sortingType != null && filter.sortingType === 'ADDED')
      {
        qb.orderBy('user.ID', filter.sorting);
      }
    }

    qb.offset((filter.currentPage) * filter.itemsPrPage);
    qb.limit(filter.itemsPrPage);

    const result = await qb.getMany();
    const count = await qb.getCount();

    const resultConverted: UserDTO[] = result.map((user) => {return { ID: user.ID, username: user.username, status: user.status, role: user.role }});
    const filterList: FilterList<UserDTO> = {list: resultConverted, totalItems: count};
    return filterList;
  }

  async verifyUser(username: string, verificationCode: string) {

    if(verificationCode == null || verificationCode == undefined || verificationCode.length < this.verificationTokenCount)
    {
      throw new Error('Invalid verification code entered');
    }

    let foundUser = await this.getUserByUsername(username);
    const hashedVerificationCode = this.generateHash(verificationCode, foundUser.salt);

    let qb = this.userRepository.createQueryBuilder("user");
    qb.leftJoinAndSelect('user.status', 'status');
    qb.andWhere(`user.username = :username`, { username: `${username}`});
    qb.andWhere(`user.verificationCode = :verificationCode`, { verificationCode: `${hashedVerificationCode}`});
    foundUser = await qb.getOne();

    if(foundUser == null)
    {
      throw new Error('Wrong verification code entered');
    }
    if(foundUser.status.status.toLowerCase() != 'pending')
    {
      throw new Error('This user has already been verified');
    }

    const activeStatus: Status = await this.statusService.findStatusByName('active');
    foundUser.status = activeStatus;

    await this.userRepository.save(foundUser);
  }

  async updateUser(userDTO: UserDTO): Promise<User>{

    const foundUser = await this.getUserByID(userDTO.ID);
    foundUser.ID = userDTO.ID;
    foundUser.username = userDTO.username;
    foundUser.status = userDTO.status;
    foundUser.role = userDTO.role;

    this.verifyUserEntity(foundUser);

    let updatedUser;

    try{updatedUser = await this.userRepository.save(foundUser);}
    catch (e) {throw new Error('Internal server error')}

    if(updatedUser == null || updatedUser == undefined){throw new Error('Error updating user')}
    return updatedUser;
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

  async generateNewVerificationCode(user: User): Promise<string>{

    if(user.status.status.toLowerCase() != 'pending'){
      throw new Error('This user has already been verified');
    }

    this.verifyUserEntity(user);
    const verificationCode = this.authenticationHelper.generateToken(this.verificationTokenCount);
    const hashedVerificationCode = this.authenticationHelper.generateHash(verificationCode, user.salt);
    user.verificationCode = hashedVerificationCode;
    try{await this.userRepository.save(user);}
    catch (e) {throw new Error('Internal server error')}
    return verificationCode;
  }

  //Status error is thrown if user is disabled
  async login(username: string, password: string): Promise<User> {

    if(username == null || password == null){
      throw new Error('Username or Password is non-existing');
    }

    let foundUser = await this.getUserByUsername(username);
    this.authenticationHelper.validateLogin(foundUser, password);

    if(foundUser.status.status.toLowerCase() == 'disabled'){
      throw new Error('This user has been disabled');
    }


    return foundUser;
  }

  verifyJWTToken(token: string): boolean {
    if(token == undefined || token == null || token.length == 0) {throw new Error('Must enter a valid token');}
    return this.authenticationHelper.validateJWTToken(token);
  }

  verifyUserEntity(user: User) {
    if(user == undefined || user == null) {throw new Error('User must be instantiated');}
    if(user.ID == undefined || user.ID == null || user.ID < 0){throw new Error('User must have a valid ID')}
    if(user.username == undefined || user.username == null || !this.emailRegex.test(user.username)){throw new Error('User must have a valid Username');}
    if(user.password == undefined || user.password == null || user.password.length <= 0){throw new Error('User must have a valid Password');}
    if(user.salt == undefined || user.salt == null || user.salt.length <= 0){throw new Error('An error occurred with Salt');}
    if(user.role == undefined || user.role == null || user.role.ID <= 0){throw new Error('An error occurred with user role');}
    if(user.status == undefined || user.status == null || user.status.ID <= 0){throw new Error('An error occurred with user status');}
  }

  async generatePasswordResetToken(username: string): Promise<string>{

    let user = await this.getUserByUsername(username);
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

  async updatePassword(username: string, passwordToken: string, password: string){

    if(password == null || password == undefined || password.length < 8){
      throw new Error('Password must be minimum 8 characters long');
    }

    let foundUser = await this.getUserByUsername(username);
    await this.verifyPasswordToken(foundUser, passwordToken);

    foundUser.salt = this.authenticationHelper.generateToken(this.saltLength);
    foundUser.password = this.authenticationHelper.generateHash(password, foundUser.salt);

    try{await this.userRepository.save(foundUser);}
    catch (e) {throw new Error('Internal server error')}

    return true;
  }

  //Missing test
  async getAllUserRoles(): Promise<Role[]>{
    return await this.roleService.getRoles();
  }

  //Missing test
  async getAllStatuses(): Promise<Status[]>{
    return await this.statusService.getStatuses();
  }

}
