import { Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Put, Query, UseGuards } from "@nestjs/common";
import { IUserService, IUserServiceProvider } from "../../core/primary-ports/user.service.interface";
import { User } from "../../core/models/user";
import { IMailService, IMailServiceProvider } from "../../core/primary-ports/mail.service.interface";
import { LoginDTO } from "../dtos/login.dto";
import { LoginResponseDTO } from "../dtos/login.response.dto";
import { VerificationDTO } from "../dtos/verification.dto";
import { VerificationRequestDTO } from "../dtos/verification.request.dto";
import { PasswordChangeRequestDTO } from "../dtos/password.change.request.dto";
import { Filter } from "../../core/models/filter";
import { JwtAuthGuard } from "../../auth/jwt-auth-guard";
import { Roles } from "../../auth/roles.decorator";
import { UserDTO } from "../dtos/user.dto";
import { ISocketService, ISocketServiceProvider } from "../../core/primary-ports/socket.service.interface";
import { UserPasswordUpdateDTO } from "../dtos/user.password.update.dto";

@Controller('user')
export class UserController {

  constructor(@Inject(IUserServiceProvider) private userService: IUserService,
              @Inject(IMailServiceProvider) private mailService: IMailService,
              @Inject(ISocketServiceProvider) private socketService: ISocketService) {}

  @Post('register')
  async register(@Body() loginDto: LoginDTO){
    try
    {
      let createdUser: User = await this.userService.createUser(loginDto.username, loginDto.password);
      let [savedUser, verificationCode] = await this.userService.addUser(createdUser);
      this.mailService.sendUserConfirmation(savedUser.username, verificationCode);
    }
    catch (e)
    {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  //@Roles('Admin')
  //@UseGuards(JwtAuthGuard)
  @Post('registerUsers')
  async registerUsers(@Body() unregisteredUsers: User[]){
    try
    {
      let allUsers: User[];
      let registeredUsers: User[];
      let confirmationTokens: string[];

      [allUsers, registeredUsers, confirmationTokens] = await this.userService.registerUsers(unregisteredUsers);

      let allUsersConverted: UserDTO[] = allUsers.map(user => {return {ID: user.ID, username: user.username, status: user.status, role: user.role}});
      let emails: string[] = registeredUsers.map(user => {return user.username});
      this.mailService.sendUsersRegistrationInvite(emails, confirmationTokens);
      return allUsersConverted;
    }
    catch (e)
    {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('resendVerificationMail')
  async resendVerificationMail(@Query() verificationRequestDTO: VerificationRequestDTO){

    try{
      let foundUser = await this.userService.getUserByUsername(verificationRequestDTO.email);
      let verificationCode = await this.userService.generateNewVerificationCode(foundUser);
      this.mailService.sendUserConfirmation(foundUser.username, verificationCode);
    }
    catch (e) {throw new HttpException(e.message, HttpStatus.BAD_REQUEST);}

  }

  @Get('getUserByID')
  async getUserByID(@Query() userID: any){

    try{
      let foundUser = await this.userService.getUserByID(userID.ID);
      let userDTO: UserDTO = {ID: foundUser.ID, role: foundUser.role, username: foundUser.username, status: foundUser.status};
      return userDTO;
    }
    catch (e) {throw new HttpException(e.message, HttpStatus.BAD_REQUEST);}
  }

  @Post('login')
  async login(@Body() loginDto: LoginDTO){

    let foundUser, tokenString;

    try
    {
      foundUser = await this.userService.login(loginDto.username, loginDto.password);
      tokenString = this.userService.generateJWTToken(foundUser);
    }
    catch (e)
    {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }

    if(foundUser.status.status.toLowerCase() == 'pending')
    {
      throw new HttpException('Email has not been confirmed for this user. Please confirm this account before logging in.', 423)
    }

    const responseDTO: LoginResponseDTO = {token: tokenString};
    return responseDTO;
  }

  @Post('verifyToken')
  verifyToken(@Body() loginResponseDTO: LoginResponseDTO){
    try{return this.userService.verifyJWTToken(loginResponseDTO.token);}
    catch (e) {throw new HttpException(e.message, HttpStatus.UNAUTHORIZED);}
  }

  @Post('verifyUser')
  async verifyUser(@Body() verificationDTO: VerificationDTO){
    try{await this.userService.verifyUser(verificationDTO.username, verificationDTO.verificationCode);}
    catch (e) {throw new HttpException(e.message, HttpStatus.BAD_REQUEST);}
  }

  @Post('requestPasswordSignupChange')
  async requestPasswordSignupChange(@Body() passwordChangeRequestDTO: PasswordChangeRequestDTO){
    try{
      await this.userService.updatePasswordConfirmationToken(passwordChangeRequestDTO.username, passwordChangeRequestDTO.verificationCode, passwordChangeRequestDTO.password);
      this.mailService.sendUserPasswordResetConfirmation(passwordChangeRequestDTO.username);
    }
    catch (e) {throw new HttpException(e.message, HttpStatus.BAD_REQUEST);}
  }

  @Get('requestPasswordMail')
  async requestPasswordResetMail(@Query() verificationRequestDTO: VerificationRequestDTO){
    try{
      const passwordResetToken: string = await this.userService.generatePasswordResetToken(verificationRequestDTO.email);
      this.mailService.sendUserPasswordReset(verificationRequestDTO.email, passwordResetToken);
    }
    catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('verifyPasswordToken')
  async verifyPasswordToken(@Body() verificationDTO: VerificationDTO){
    try {
      let foundUser = await this.userService.getUserByUsername(verificationDTO.username);
      await this.userService.verifyPasswordToken(foundUser, verificationDTO.verificationCode);
    }
    catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('requestPasswordChange')
  async requestPasswordChange(@Body() passwordChangeRequestDTO: PasswordChangeRequestDTO){
    try {
      await this.userService.updatePasswordWithToken(passwordChangeRequestDTO.username, passwordChangeRequestDTO.verificationCode, passwordChangeRequestDTO.password);
      this.mailService.sendUserPasswordResetConfirmation(passwordChangeRequestDTO.username);
    }
    catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getUsers')
  async getAllUsers(@Query() filter: Filter){
    try{
      return await this.userService.getUsers(filter);
    }
    catch(e){
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Put('updateUser')
  async updateUser(@Body() userDTO: UserDTO){
    try{
      await this.userService.updateUser(userDTO);
      return userDTO;
    }
    catch(e){
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('updatePassword')
  async updatePassword(@Body() userPasswordUpdateDTO: UserPasswordUpdateDTO){
    try {
      await this.userService.updatePasswordWithID(userPasswordUpdateDTO.userID, userPasswordUpdateDTO.password, userPasswordUpdateDTO.oldPassword);
    }
    catch (e) {throw new HttpException(e.message, HttpStatus.BAD_REQUEST);}
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getUserRoles')
  async getAllRoles(){
    try {
      return await this.userService.getAllUserRoles();
    }
    catch(e){
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getUserStatuses')
  async getAllStatuses(){
    try {
      return await this.userService.getAllStatuses();
    }
    catch(e){
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
