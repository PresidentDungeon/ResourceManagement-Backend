import { Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Put, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { IUserService, IUserServiceProvider } from "../../core/primary-ports/application-services/user.service.interface";
import { User } from "../../core/models/user";
import { LoginDTO } from "../dtos/login.dto";
import { LoginResponseDTO } from "../dtos/login.response.dto";
import { VerificationDTO } from "../dtos/verification.dto";
import { VerificationRequestDTO } from "../dtos/verification.request.dto";
import { PasswordChangeRequestDTO } from "../dtos/password.change.request.dto";
import { Filter } from "../../core/models/filter";
import { JwtAuthGuard } from "../security/jwt-auth-guard";
import { Roles } from "../security/roles.decorator";
import { UserDTO } from "../dtos/user.dto";
import { UserPasswordUpdateDTO } from "../dtos/user.password.update.dto";
import { ErrorInterceptor } from "../error-handling/error-interceptor";
import { FilterList } from "src/core/models/filterList";
import { Role } from "src/core/models/role";
import { Status } from "src/core/models/status";

@Controller('user')
@UseInterceptors(ErrorInterceptor)
export class UserController {

  constructor(@Inject(IUserServiceProvider) private userService: IUserService) {}

  @Post('register')
  async register(@Body() loginDTO: LoginDTO): Promise<void> {
    await this.userService.createUser(loginDTO.username, loginDTO.password);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('registerUser')
  async registerUser(@Query() query: any): Promise<UserDTO> {
    let user: User = await this.userService.registerUser(query.username);
    let userConverted: UserDTO = {ID: user.ID, username: user.username, status: user.status, role: user.role};
    return userConverted;
  }

  @Get('resendVerificationMail')
  async resendVerificationMail(@Query() verificationRequestDTO: VerificationRequestDTO): Promise<void> {
    let foundUser = await this.userService.getUserByUsername(verificationRequestDTO.email);
    await this.userService.generateNewVerificationCode(foundUser);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUserByID')
  async getUserByID(@Query() userID: any): Promise<UserDTO> {
    let foundUser = await this.userService.getUserByID(userID.ID);
    let userDTO: UserDTO = {ID: foundUser.ID, role: foundUser.role, username: foundUser.username, status: foundUser.status};
    return userDTO;
  }

  @UseGuards(JwtAuthGuard)
  @Get('getUsersByDomain')
  async getUsersByDomain(@Query() query: any): Promise<User[]> {
    return await this.userService.getUsersByWhitelistDomain(query.title);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getUsernames')
  async getUsernames(@Query() query: any): Promise<string[]> {
    let usernames: string[] = await this.userService.getUsernames(query.username);
    return usernames;
  }

  @Post('login')
  async login(@Body() loginDTO: LoginDTO): Promise<LoginResponseDTO> {
    let foundUser, tokenString;
    foundUser = await this.userService.login(loginDTO.username, loginDTO.password);
    tokenString = this.userService.generateJWT(foundUser);
    const responseDTO: LoginResponseDTO = {token: tokenString};
    return responseDTO;
  }

  @Post('verifyToken')
  verifyToken(@Body() loginResponseDTO: LoginResponseDTO): boolean {
    try{return this.userService.verifyJWT(loginResponseDTO.token);}
    catch (e) {throw new HttpException(e.message, HttpStatus.UNAUTHORIZED);}
  }

  @Post('verifyUser')
  async verifyUser(@Body() verificationDTO: VerificationDTO): Promise<void> {
    await this.userService.verifyUser(verificationDTO.username, verificationDTO.verificationCode);
  }

  @Post('requestPasswordSignupChange')
  async requestPasswordSignupChange(@Body() passwordChangeRequestDTO: PasswordChangeRequestDTO): Promise<void> {
    await this.userService.updatePasswordWithConfirmationToken(passwordChangeRequestDTO.username, passwordChangeRequestDTO.verificationCode, passwordChangeRequestDTO.password);
  }

  @Get('requestPasswordMail')
  async requestPasswordResetMail(@Query() verificationRequestDTO: VerificationRequestDTO): Promise<void> {
    await this.userService.generatePasswordResetToken(verificationRequestDTO.email);
  }

  @Post('verifyConfirmationToken')
  async verifyConfirmationToken(@Body() verificationDTO: VerificationDTO): Promise<void> {
    let foundUser = await this.userService.getUserByUsername(verificationDTO.username);
    await this.userService.verifyUserConfirmationToken(foundUser, verificationDTO.verificationCode);
  }

  @Post('verifyPasswordToken')
  async verifyPasswordToken(@Body() verificationDTO: VerificationDTO): Promise<void> {
    let foundUser = await this.userService.getUserByUsername(verificationDTO.username);
    await this.userService.verifyPasswordToken(foundUser, verificationDTO.verificationCode);
  }

  @Post('requestPasswordChange')
  async requestPasswordChange(@Body() passwordChangeRequestDTO: PasswordChangeRequestDTO): Promise<void> {
    await this.userService.updatePasswordWithToken(passwordChangeRequestDTO.username, passwordChangeRequestDTO.verificationCode, passwordChangeRequestDTO.password);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getUsers')
  async getAllUsers(@Query() filter: Filter): Promise<FilterList<UserDTO>> {
    return await this.userService.getUsers(filter);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Put('updateUser')
  async updateUser(@Body() userDTO: UserDTO): Promise<UserDTO> {
    await this.userService.updateUser(userDTO);
    return userDTO;
  }

  @UseGuards(JwtAuthGuard)
  @Put('updatePassword')
  async updatePassword(@Body() userPasswordUpdateDTO: UserPasswordUpdateDTO): Promise<void> {
    await this.userService.updatePasswordWithID(userPasswordUpdateDTO.userID, userPasswordUpdateDTO.password, userPasswordUpdateDTO.oldPassword);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getUserRoles')
  async getAllRoles(): Promise<Role[]> {
    return await this.userService.getAllUserRoles();
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getUserStatuses')
  async getAllStatuses(): Promise<Status[]>{
    return await this.userService.getAllStatuses();
  }

  @UseGuards(JwtAuthGuard)
  @Get('verifyUserApprovedStatus')
  async verifyUserApprovedStatus(@Req() request: any): Promise<boolean> {
    return await this.userService.verifyUserApprovedStatus(request.user.userID);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('verifyAdmin')
  async verifyAdmin(): Promise<void> {
    // Used to verify admin.
  }
}
