import { Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Put, Query, UseGuards } from "@nestjs/common";
import { IContractService, IContractServiceProvider } from "../../core/primary-ports/contract.service.interface";
import { Contract } from "../../core/models/contract";
import { Resume } from "../../core/models/resume";
import { Roles } from "../../auth/roles.decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth-guard";
import { Filter } from "../../core/models/filter";

@Controller('contract')
export class ContractController {

  constructor(@Inject(IContractServiceProvider) private contractService: IContractService) {}

  //@Roles('Admin')
  //@UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() contract: Contract){
    try
    {
      let createdContract: Contract = await this.contractService.addContract(contract);
      return createdContract;
    }
    catch (e)
    {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  //@UseGuards(JwtAuthGuard)
  @Get('getContractByID')
  async getContractByID(@Query() contractID: any){
    try{
      return await this.contractService.getContractByID(contractID.ID);
    }
    catch(e){
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //@Roles('Admin')
  //@UseGuards(JwtAuthGuard)
  @Get('getContracts')
  async getAllContracts(@Query() filter: Filter){
    try{
      return await this.contractService.getContracts(filter);
    }
    catch(e){console.log(e);
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('getResumeAmount')
  async getResumeAmount(@Query() resumeID: any){
    try{
      return await this.contractService.getResumeCount(resumeID.ID);
    }
    catch(e){
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('getResumesAmount')
  async getResumesAmount(@Body() resumes: Resume[]){
    try{
      return await this.contractService.getResumesCount(resumes);
    }
    catch(e){
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //@Roles('Admin')
  //@UseGuards(JwtAuthGuard)
  @Put('update')
  async updateContract(@Body() contract: Contract){
    try{
      const updatedContract = await this.contractService.update(contract);
      return updatedContract;
    }
    catch(e){
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put('delete')
  async deleteContract(@Body() contract: Contract){
    try{
      const updatedContract = await this.contractService.delete(contract.ID);
      return updatedContract;
    }
    catch(e){
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

}
