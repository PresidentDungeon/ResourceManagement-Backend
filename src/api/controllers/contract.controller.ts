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
  Query, Req,
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
import { ISocketService, ISocketServiceProvider } from "../../core/primary-ports/socket.service.interface";
import { CommentDTO } from "../dtos/comment.dto";
import { query } from "express";

@Controller('contract')
export class ContractController {

  constructor(
    @Inject(IContractServiceProvider) private contractService: IContractService,
    @Inject(IResumeServiceProvider) private resumeService: IResumeService,
    @Inject(ISocketServiceProvider) private socketService: ISocketService) { }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() contract: Contract) {
    try {
      let createdContract: Contract = await this.contractService.addContract(contract);
      this.contractService.getContractByID(createdContract.ID, true).then((contract) => { this.socketService.emitContractCreateEvent(contract) });
      return createdContract;
    }
    catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('requestContract')
  async requestContract(@Body() contract: Contract) {
    try {
      let createdContract: Contract = await this.contractService.addRequestContract(contract);
      return createdContract;
    }
    catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('saveComment')
  async saveComment(@Body() commentDTO: CommentDTO) {
    try {
      await this.contractService.saveComment(commentDTO);
    }
    catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getComments')
  async getContractComments(@Query() commentID: any) {
    try {
      await this.contractService.getContractComments(commentID.ID);
    }
    catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContractByID')
  async getContractByID(@Query() contractID: any) {
    try {
      const contract: Contract = await this.contractService.getContractByID(contractID.ID, false);
      const resumes: Resume[] = await this.resumeService.getResumesByID(contract.resumes, false);
      contract.resumes = resumes;
      return contract;
    }
    catch (e) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('getContractByIDUser')
  async getContractByIDUser(@Query() contractID: any, @Req() request) {
    try {
      let userID = request.user.userID;
      const contract: Contract = await this.contractService.getContractByID(contractID.ID, true, userID);
      const resumes: Resume[] = await this.resumeService.getResumesByID(contract.resumes, true);
      contract.resumes = resumes;
      return contract;
    }
    catch (e) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContractsByResume')
  async getContractsByResume(@Query() resumeID: any) {
    try {
      const contracts: Contract[] = await this.contractService.getContractsByResume(resumeID.ID);
      return contracts;
    }
    catch (e) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('getContractByUserID')
  async getContractByUserID(@Query() statusID: any, @Req() request) {
    try {
      return await this.contractService.getContractByUserID(request.user.userID, statusID.ID);
    }
    catch (e) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContracts')
  async getAllContracts(@Query() filter: Filter) {
    try {
      return await this.contractService.getContracts(filter);
    }
    catch (e) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Put('update')
  async updateContract(@Body() contract: Contract) {
    try {
      const updatedContract = await this.contractService.update(contract);
      this.contractService.getContractByID(contract.ID, false).then((contract) => { this.socketService.emitContractUpdateEvent(contract) });
      return updatedContract;
    }
    catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('contractStateReply')
  async confirmContractState(@Body() contractStateReplyDTO: ContractStateReplyDTO) {
    try {
      const updatedContract = await this.contractService.confirmContract(contractStateReplyDTO.contract, contractStateReplyDTO.isAccepted);
      this.contractService.getContractByID(contractStateReplyDTO.contract.ID, false).then((contract) => { this.socketService.emitContractUpdateEvent(contract) });
      return updatedContract;
    }
    catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('requestRenewal')
  async requestRenewal(@Body() contract: Contract) {
    try {
      const updatedContract = await this.contractService.requestRenewal(contract);
      this.contractService.getContractByID(contract.ID, false).then((contract) => { this.socketService.emitContractUpdateEvent(contract) });
      return updatedContract;
    }
    catch (e) { throw new HttpException(e.message, HttpStatus.BAD_REQUEST); }
  }

  @Delete('delete')
  async deleteContract(@Body() contract: Contract) {
    try {
      const updatedContract = await this.contractService.delete(contract.ID);
      return updatedContract;
    }
    catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContractStatuses')
  async getAllStatuses() {
    try {
      return await this.contractService.getAllStatuses();
    }
    catch (e) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('getAllUserStatuses')
  async getAllUserStatuses() {
    try {
      return await this.contractService.getAllUserStatuses();
    }
    catch (e) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
