import { Controller, Get, HttpException, HttpStatus, Inject } from "@nestjs/common";
import { IRoleService, IRoleServiceProvider } from "../../core/primary-ports/role.service.interface";

@Controller('role')
export class RoleController {

  constructor(@Inject(IRoleServiceProvider) private roleService: IRoleService) {}

  //@Roles('Admin')
  //@UseGuards(JwtAuthGuard)
  @Get('getRoles')
  async getAllUsers(){
    try {
      return await this.roleService.getRoles();
    }
    catch(e){
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
