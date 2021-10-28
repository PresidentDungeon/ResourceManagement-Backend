import { Body, Controller, HttpException, HttpStatus, Inject, Post } from "@nestjs/common";
import { IUserService, IUserServiceProvider } from "../../core/primary-ports/user.service.interface";
import { LoginDto } from "../dtos/login.dto";
import { User } from "../../core/models/user";
import { LoginResponseDto } from "../dtos/login.response.dto";
import { Role } from "../../core/models/role";
import { IRoleService, IRoleServiceProvider } from "../../core/primary-ports/role.service.interface";
import { IMailService, IMailServiceProvider } from "../../core/primary-ports/mail.service.interface";

@Controller('user')
export class UserController {

  constructor(@Inject(IUserServiceProvider) private userService: IUserService, @Inject(IRoleServiceProvider) private roleService: IRoleService,
              @Inject (IMailServiceProvider) private mailService: IMailService) {}

  @Post('register')
  async register(@Body() loginDto: LoginDto){
    try
    {
      let createdUser: User = this.userService.createUser(loginDto.username, loginDto.password);
      let foundRole: Role = await this.roleService.findRoleByName('user');
      createdUser.role = foundRole;

      let addedUser: User = await this.userService.addUser(createdUser);
      this.mailService.sendUserConfirmation(addedUser, addedUser.verificationCode);
      return addedUser;
    }
    catch (e)
    {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('mailTest')
  async mailTest(@Body() loginDto: LoginDto){

    let user: User = {
      ID: 1,
      username: loginDto.username,
      password: '',
      role: {ID: 1, role: "Admin"},
      salt: 'value',
      verificationCode: '2x32yz'
    }

    this.mailService.sendUserConfirmation(user, user.verificationCode);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto){
  }

  @Post('verifyToken')
  verifyToken(@Body() loginResponseDTO: LoginResponseDto){
    try{return this.userService.verifyJWTToken(loginResponseDTO.token);}
    catch (e) {throw new HttpException(e.message, HttpStatus.NOT_FOUND);}
  }
}
