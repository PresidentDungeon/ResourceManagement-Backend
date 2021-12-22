import { Body, Controller, Delete, Get, Inject, Post, Put, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { ErrorInterceptor } from "../error-handling/error-interceptor";
import { Whitelist } from "../../core/models/whitelist";
import { Roles } from "../security/roles.decorator";
import { JwtAuthGuard } from "../security/jwt-auth-guard";
import { Filter } from "../../core/models/filter";
import { IWhitelistService, IWhitelistServiceProvider } from "../../core/primary-ports/application-services/whitelist.service.interface";

@Controller('whitelist')
@UseInterceptors(ErrorInterceptor)
export class WhitelistController {

  constructor(@Inject(IWhitelistServiceProvider) private whitelistService: IWhitelistService) {
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Post('createWhitelist')
  async createWhitelist(@Body() whitelist: Whitelist) {
    let newWhitelist = await this.whitelistService.addWhitelist(whitelist);
    return newWhitelist;
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getWhitelists')
  async getWhitelists(@Query() filter: Filter) {
    return await this.whitelistService.getWhitelists(filter);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Put('updateWhitelist')
  async updateWhitelist(@Body() whitelist: Whitelist) {
    let updatedWhitelist = await this.whitelistService.updateWhitelist(whitelist);
    return updatedWhitelist;
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Post('deleteWhitelist')
  async deleteWhitelist(@Body() whitelist: Whitelist) {
    await this.whitelistService.deleteWhitelist(whitelist);
  }

}
