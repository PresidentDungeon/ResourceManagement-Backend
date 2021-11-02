import { Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Query, UseGuards } from "@nestjs/common";
import { IUserService, IUserServiceProvider } from "../../core/primary-ports/user.service.interface";
import { User } from "../../core/models/user";
import { Role } from "../../core/models/role";
import { IRoleService, IRoleServiceProvider } from "../../core/primary-ports/role.service.interface";
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

@Controller('user')
export class UserController {

  constructor(@Inject(IUserServiceProvider) private userService: IUserService, @Inject(IRoleServiceProvider) private roleService: IRoleService,
              @Inject (IMailServiceProvider) private mailService: IMailService) {}

  @Post('register')
  async register(@Body() loginDto: LoginDTO){
    try
    {
      let createdUser: User = this.userService.createUser(loginDto.username, loginDto.password);
      let foundRole: Role = await this.roleService.findRoleByName('user');
      createdUser.role = foundRole;

      let verificationToken: string = await this.userService.addUser(createdUser);
      this.mailService.sendUserConfirmation(loginDto.username, verificationToken);
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

    if(foundUser.status == 'pending')
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
      await this.userService.updatePassword(passwordChangeRequestDTO.username, passwordChangeRequestDTO.verificationCode, passwordChangeRequestDTO.password);
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
  @Post('updateUser')
  async updateUser(@Body() userDTO: UserDTO){
    try{
      return await this.userService.updateUser(userDTO);
    }
    catch(e){
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

}
