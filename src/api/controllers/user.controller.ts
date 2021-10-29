import { Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Query } from "@nestjs/common";
import { IUserService, IUserServiceProvider } from "../../core/primary-ports/user.service.interface";
import { User } from "../../core/models/user";
import { Role } from "../../core/models/role";
import { IRoleService, IRoleServiceProvider } from "../../core/primary-ports/role.service.interface";
import { IMailService, IMailServiceProvider } from "../../core/primary-ports/mail.service.interface";
import { LoginDTO } from "../dtos/login.dto";
import { LoginResponseDTO } from "../dtos/login.response.dto";
import { VerificationDTO } from "../dtos/verification.dto";
import { VerificationRequestDTO } from "../dtos/verification.request.dto";

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

      let addedUser: User = await this.userService.addUser(createdUser);
      this.mailService.sendUserConfirmation(addedUser, addedUser.verificationCode);
    }
    catch (e)
    {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('resendVerificationMail')
  async resendVerificationMail(@Query() verificationRequestDTO: VerificationRequestDTO){
    try
    {
      console.log(verificationRequestDTO.username);
      const [foundUser] = await this.userService.getUserByUsername(verificationRequestDTO.username);
      this.mailService.sendUserConfirmation(foundUser, foundUser.verificationCode);
    }
    catch (e)
    {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDTO){

    let foundUser, status, tokenString;

    try
    {
      [foundUser, status] = await this.userService.login(loginDto.username, loginDto.password);
      tokenString = this.userService.generateJWTToken(foundUser);
    }
    catch (e)
    {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }

    if(status == 'pending')
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
    try{await this.userService.verifyUser(verificationDTO.ID, verificationDTO.verificationCode);}
    catch (e) {throw new HttpException(e.message, HttpStatus.BAD_REQUEST);}
  }
}
