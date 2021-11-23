import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Put,
  Query,
  UseGuards
} from "@nestjs/common";
import { IContractService, IContractServiceProvider } from "../../core/primary-ports/contract.service.interface";
import { Contract } from "../../core/models/contract";
import { Resume } from "../../core/models/resume";
import { Roles } from "../../auth/roles.decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth-guard";
import { Filter } from "../../core/models/filter";
import { ResumeAmountRequestDTO } from "../dtos/resume.amount.request.dto";
import { ContractStateReplyDTO } from "../dtos/contract.state.reply.dto";
import { IResumeService, IResumeServiceProvider } from "../../core/primary-ports/resume.service.interface";

@Controller('contract')
export class ContractController {

  constructor(
    @Inject(IContractServiceProvider) private contractService: IContractService,
    @Inject(IResumeServiceProvider) private resumeService: IResumeService) {}

  //@Roles('Admin')
  //@UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() contract: Contract){
    try {
      let createdContract: Contract = await this.contractService.addContract(contract);
      return createdContract;
    }
    catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  //@Roles('Admin')
  //@UseGuards(JwtAuthGuard)
  @Get('getContractByID')
  async getContractByID(@Query() contractID: any){
    try{
      const contract: Contract = await this.contractService.getContractByID(contractID.ID, false);
      const resumes: Resume[] = await this.resumeService.getResumesByID(contract.resumes, false);
      contract.resumes = resumes;
      return contract;
    }
    catch(e){
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  //@UseGuards(JwtAuthGuard)
  @Get('getContractByIDUser')
  async getContractByIDUser(@Query() contractID: any){
    try{
      const contract: Contract = await this.contractService.getContractByID(contractID.ID, true);
      const resumes: Resume[] = await this.resumeService.getResumesByID(contract.resumes, true);
      contract.resumes = resumes;
      return contract;
    }
    catch(e){
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  //@UseGuards(JwtAuthGuard)
  @Get('getContractByUserID')
  async getContractByUserID(@Query() userID: any){
    try{
      return await this.contractService.getContractByUserID(userID.ID);
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

  @UseGuards(JwtAuthGuard)
  @Post('contractStateReply')
  async confirmContractState(@Body() contractStateReplyDTO: ContractStateReplyDTO){
    try{
      const updatedContract = await this.contractService.confirmContract(contractStateReplyDTO.contract, contractStateReplyDTO.isAccepted);
      return updatedContract;
    }
    catch(e){
      console.log(e);
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('delete')
  async deleteContract(@Body() contract: Contract){
    try{
      const updatedContract = await this.contractService.delete(contract.ID);
      return updatedContract;
    }
    catch(e){
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContractStatuses')
  async getAllStatuses(){
    try {
      return await this.contractService.getAllStatuses();
    }
    catch(e){
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
