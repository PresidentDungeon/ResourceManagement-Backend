import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { IContractService, IContractServiceProvider } from "../../core/primary-ports/contract.service.interface";
import { Contract } from "../../core/models/contract";
import { Resume } from "../../core/models/resume";
import { Roles } from "../../auth/roles.decorator";
import { JwtAuthGuard } from "../../auth/jwt-auth-guard";
import { Filter } from "../../core/models/filter";
import { ContractStateReplyDTO } from "../dtos/contract.state.reply.dto";
import { IResumeService, IResumeServiceProvider } from "../../core/primary-ports/resume.service.interface";
import { ISocketService, ISocketServiceProvider } from "../../core/primary-ports/socket.service.interface";
import { CommentDTO } from "../dtos/comment.dto";
import { ErrorInterceptor } from "../../infrastructure/error-handling/error-interceptor";

@Controller('contract')
@UseInterceptors(ErrorInterceptor)
export class ContractController {

  constructor(
    @Inject(IContractServiceProvider) private contractService: IContractService,
    @Inject(IResumeServiceProvider) private resumeService: IResumeService,
    @Inject(ISocketServiceProvider) private socketService: ISocketService) { }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(@Body() contract: Contract) {
    let createdContract: Contract = await this.contractService.addContract(contract);
    this.contractService.getContractByID(createdContract.ID, true).then((contract) => { this.socketService.emitContractCreateEvent(contract) });
    return createdContract;
  }

  @UseGuards(JwtAuthGuard)
  @Post('requestContract')
  async requestContract(@Body() contract: Contract) {
    let createdContract: Contract = await this.contractService.addRequestContract(contract);
    return createdContract;
  }

  @UseGuards(JwtAuthGuard)
  @Post('saveComment')
  async saveComment(@Body() commentDTO: CommentDTO) {
    await this.contractService.saveComment(commentDTO);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getComments')
  async getContractComments(@Query() commentID: any) {
    return await this.contractService.getContractComments(commentID.ID);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContractByID')
  async getContractByID(@Query() contractID: any) {
    const contract: Contract = await this.contractService.getContractByID(contractID.ID, false);
    const resumes: Resume[] = await this.resumeService.getResumesByID(contract.resumes, false);
    contract.resumes = resumes;
    return contract;
  }

  @UseGuards(JwtAuthGuard)
  @Get('getContractByIDUser')
  async getContractByIDUser(@Query() contractID: any, @Req() request) {
    let userID = request.user.userID;
    const contract: Contract = await this.contractService.getContractByID(contractID.ID, true, userID);
    const resumes: Resume[] = await this.resumeService.getResumesByID(contract.resumes, true);
    contract.resumes = resumes;
    return contract;
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContractsByResume')
  async getContractsByResume(@Query() resumeID: any) {
    const contracts: Contract[] = await this.contractService.getContractsByResume(resumeID.ID);
    return contracts;
  }

  @UseGuards(JwtAuthGuard)
  @Get('getContractByUserID')
  async getContractByUserID(@Query() statusID: any, @Req() request) {
    return await this.contractService.getContractsByUserID(request.user.userID, statusID.ID);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContracts')
  async getAllContracts(@Query() filter: Filter) {
    return await this.contractService.getContracts(filter);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Put('update')
  async updateContract(@Body() contract: Contract) {
    const updatedContract = await this.contractService.update(contract);
    this.contractService.getContractByID(contract.ID, false).then((contract) => { this.socketService.emitContractUpdateEvent(contract) });
    return updatedContract;
  }

  @UseGuards(JwtAuthGuard)
  @Post('contractStateReply')
  async confirmContractState(@Body() contractStateReplyDTO: ContractStateReplyDTO) {
    const updatedContract = await this.contractService.confirmContract(contractStateReplyDTO.contract, contractStateReplyDTO.isAccepted);
    this.contractService.getContractByID(contractStateReplyDTO.contract.ID, false).then((contract) => { this.socketService.emitContractUpdateEvent(contract) });
    return updatedContract;
  }

  @UseGuards(JwtAuthGuard)
  @Post('requestRenewal')
  async requestRenewal(@Body() contract: Contract) {
    const updatedContract = await this.contractService.requestRenewal(contract);
    this.contractService.getContractByID(contract.ID, false).then((contract) => { this.socketService.emitContractUpdateEvent(contract) });
    return updatedContract;
  }

  @Delete('delete')
  async deleteContract(@Body() contract: Contract) {
    const updatedContract = await this.contractService.delete(contract.ID);
    return updatedContract;
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContractStatuses')
  async getAllStatuses() {
    return await this.contractService.getAllStatuses();
  }

  @UseGuards(JwtAuthGuard)
  @Get('getAllUserStatuses')
  async getAllUserStatuses() {
    return await this.contractService.getAllUserStatuses();
  }

}
