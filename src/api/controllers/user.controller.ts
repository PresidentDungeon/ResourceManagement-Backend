import { Body, Controller, HttpException, HttpStatus, Inject, Post } from "@nestjs/common";
import { IUserService, IUserServiceProvider } from "../../core/primary-ports/user.service.interface";
import { LoginDto } from "../dtos/login.dto";
import { User } from "../../core/models/user";
import { LoginResponseDto } from "../dtos/login.response.dto";

@Controller('user')
export class UserController {

  constructor(@Inject(IUserServiceProvider) private userService: IUserService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto){

    try
    {
      const foundUser: User = await this.userService.login(loginDto.username, loginDto.password);
      const tokenString = this.userService.generateJWTToken(foundUser);
      const responseDTO: LoginResponseDto = {token: tokenString};
      return responseDTO;
    }
    catch (e)
    {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('verifyToken')
  verifyToken(@Body() loginResponseDTO: LoginResponseDto){
    try{return this.userService.verifyJWTToken(loginResponseDTO.token);}
    catch (e) {throw new HttpException(e.message, HttpStatus.NOT_FOUND);}
  }

}
