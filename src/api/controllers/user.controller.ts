import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
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
import { ErrorInterceptor } from "../../infrastructure/error-handling/error-interceptor";

@Controller('user')
@UseInterceptors(ErrorInterceptor)
export class UserController {

  constructor(@Inject(IUserServiceProvider) private userService: IUserService,
              @Inject(IMailServiceProvider) private mailService: IMailService,
              @Inject(ISocketServiceProvider) private socketService: ISocketService) {}

  @Post('register')
  async register(@Body() loginDto: LoginDTO){
    let createdUser: User = await this.userService.createUser(loginDto.username, loginDto.password);
    let [savedUser, verificationCode] = await this.userService.addUser(createdUser);
    this.mailService.sendUserConfirmation(savedUser.username, verificationCode);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Post('registerUsers')
  async registerUsers(@Body() unregisteredUsers: User[]){
    let allUsers: User[];
    let registeredUsers: User[];
    let confirmationTokens: string[];

    [allUsers, registeredUsers, confirmationTokens] = await this.userService.registerUsers(unregisteredUsers);

    let allUsersConverted: UserDTO[] = allUsers.map(user => {return {ID: user.ID, username: user.username, status: user.status, role: user.role}});
    this.mailService.sendUsersRegistrationInvite(registeredUsers, confirmationTokens);
    return allUsersConverted;
  }

  @Get('resendVerificationMail')
  async resendVerificationMail(@Query() verificationRequestDTO: VerificationRequestDTO){
    let foundUser = await this.userService.getUserByUsername(verificationRequestDTO.email);
    let verificationCode = await this.userService.generateNewVerificationCode(foundUser);
    this.mailService.sendUserConfirmation(foundUser.username, verificationCode);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUserByID')
  async getUserByID(@Query() userID: any){
    let foundUser = await this.userService.getUserByID(userID.ID);
    let userDTO: UserDTO = {ID: foundUser.ID, role: foundUser.role, username: foundUser.username, status: foundUser.status};
    return userDTO;
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getUsernames')
  async getUsernames(@Query() data: any){
    let usernames: string[] = await this.userService.getUsernames(data.username);
    return usernames;
  }

  @Post('login')
  async login(@Body() loginDto: LoginDTO){
    let foundUser, tokenString;
    foundUser = await this.userService.login(loginDto.username, loginDto.password);
    tokenString = this.userService.generateJWTToken(foundUser);
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
    await this.userService.verifyUser(verificationDTO.username, verificationDTO.verificationCode);
  }

  @Post('requestPasswordSignupChange')
  async requestPasswordSignupChange(@Body() passwordChangeRequestDTO: PasswordChangeRequestDTO){
    await this.userService.updatePasswordWithConfirmationToken(passwordChangeRequestDTO.username, passwordChangeRequestDTO.verificationCode, passwordChangeRequestDTO.password);
  }

  @Get('requestPasswordMail')
  async requestPasswordResetMail(@Query() verificationRequestDTO: VerificationRequestDTO){
    const passwordResetToken: string = await this.userService.generatePasswordResetToken(verificationRequestDTO.email);
    this.mailService.sendUserPasswordReset(verificationRequestDTO.email, passwordResetToken);
  }

  @Post('verifyConfirmationToken')
  async verifyConfirmationToken(@Body() verificationDTO: VerificationDTO){
    let foundUser = await this.userService.getUserByUsername(verificationDTO.username);
    await this.userService.verifyUserConfirmationToken(foundUser, verificationDTO.verificationCode);
  }

  @Post('verifyPasswordToken')
  async verifyPasswordToken(@Body() verificationDTO: VerificationDTO){
    let foundUser = await this.userService.getUserByUsername(verificationDTO.username);
    await this.userService.verifyPasswordToken(foundUser, verificationDTO.verificationCode);
  }

  @Post('requestPasswordChange')
  async requestPasswordChange(@Body() passwordChangeRequestDTO: PasswordChangeRequestDTO){
    await this.userService.updatePasswordWithToken(passwordChangeRequestDTO.username, passwordChangeRequestDTO.verificationCode, passwordChangeRequestDTO.password);
    this.mailService.sendUserPasswordResetConfirmation(passwordChangeRequestDTO.username);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getUsers')
  async getAllUsers(@Query() filter: Filter){
    return await this.userService.getUsers(filter);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Put('updateUser')
  async updateUser(@Body() userDTO: UserDTO){
    await this.userService.updateUser(userDTO);
    return userDTO;
  }

  @UseGuards(JwtAuthGuard)
  @Put('updatePassword')
  async updatePassword(@Body() userPasswordUpdateDTO: UserPasswordUpdateDTO){
    await this.userService.updatePasswordWithID(userPasswordUpdateDTO.userID, userPasswordUpdateDTO.password, userPasswordUpdateDTO.oldPassword);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getUserRoles')
  async getAllRoles(){
    return await this.userService.getAllUserRoles();
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getUserStatuses')
  async getAllStatuses(){
    return await this.userService.getAllStatuses();
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('verifyAdmin')
  async verifyAdmin(){
    // Used to verify admin.
  }
}
