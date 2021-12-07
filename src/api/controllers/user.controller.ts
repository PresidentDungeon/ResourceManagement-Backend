import { Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Put, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { IUserService, IUserServiceProvider } from "../../core/primary-ports/application-services/user.service.interface";
import { User } from "../../core/models/user";
import { LoginDTO } from "../dtos/login.dto";
import { LoginResponseDTO } from "../dtos/login.response.dto";
import { VerificationDTO } from "../dtos/verification.dto";
import { VerificationRequestDTO } from "../dtos/verification.request.dto";
import { PasswordChangeRequestDTO } from "../dtos/password.change.request.dto";
import { Filter } from "../../core/models/filter";
import { JwtAuthGuard } from "../../auth/jwt-auth-guard";
import { Roles } from "../../auth/roles.decorator";
import { UserDTO } from "../dtos/user.dto";
import { ISocketService, ISocketServiceProvider } from "../../core/primary-ports/application-services/socket.service.interface";
import { UserPasswordUpdateDTO } from "../dtos/user.password.update.dto";
import { ErrorInterceptor } from "../../infrastructure/error-handling/error-interceptor";

@Controller('user')
@UseInterceptors(ErrorInterceptor)
export class UserController {

  constructor(@Inject(IUserServiceProvider) private userService: IUserService,
              @Inject(ISocketServiceProvider) private socketService: ISocketService) {}

  @Post('register')
  async register(@Body() loginDto: LoginDTO){
    await this.userService.createUser(loginDto.username, loginDto.password);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('registerUser')
  async registerUser(@Query() query: any){
    let user: User = await this.userService.registerUser(query.username);
    let userConverted: UserDTO = {ID: user.ID, username: user.username, status: user.status, role: user.role};
    return userConverted;
  }

  @Get('resendVerificationMail')
  async resendVerificationMail(@Query() verificationRequestDTO: VerificationRequestDTO){
    let foundUser = await this.userService.getUserByUsername(verificationRequestDTO.email);
    await this.userService.generateNewVerificationCode(foundUser);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUserByID')
  async getUserByID(@Query() userID: any){
    let foundUser = await this.userService.getUserByID(userID.ID);
    let userDTO: UserDTO = {ID: foundUser.ID, role: foundUser.role, username: foundUser.username, status: foundUser.status};
    return userDTO;
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUsersByDomain')
  async getUsersByDomain(@Query() query: any){
    return await this.userService.getUsersByWhitelistDomain(query.title);
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
    await this.userService.generatePasswordResetToken(verificationRequestDTO.email);
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
