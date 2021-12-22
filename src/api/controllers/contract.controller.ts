import { Body, Controller, Delete, Get, Inject, Post, Put, Query, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { IContractService, IContractServiceProvider } from "../../core/primary-ports/application-services/contract.service.interface";
import { Contract } from "../../core/models/contract";
import { Resume } from "../../core/models/resume";
import { Roles } from "../security/roles.decorator";
import { JwtAuthGuard } from "../security/jwt-auth-guard";
import { Filter } from "../../core/models/filter";
import { ContractStateReplyDTO } from "../dtos/contract.state.reply.dto";
import { IResumeService, IResumeServiceProvider } from "../../core/primary-ports/application-services/resume.service.interface";
import { ISocketService, ISocketServiceProvider } from "../../core/primary-ports/application-services/socket.service.interface";
import { CommentDTO } from "../dtos/comment.dto";
import { Comment } from "../../core/models/comment";
import { ErrorInterceptor } from "../error-handling/error-interceptor";
import { GetUserContractsDTO } from "../dtos/get.user.contracts.dto";
import { FilterList } from "../../core/models/filterList";
import { Status } from "../../core/models/status";

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
  async create(@Body() contract: Contract): Promise<Contract> {
    let createdContract: Contract = await this.contractService.addContract(contract);
    this.socketService.emitContractCreateEvent(createdContract);
    return createdContract;
  }

  @UseGuards(JwtAuthGuard)
  @Post('requestContract')
  async requestContract(@Body() contract: Contract, @Req() request: any) {
    let createdContract: Contract = await this.contractService.addRequestContract(contract, request.user.username, request.user.status);
    this.socketService.emitContractCreateEvent(createdContract);
    return createdContract;
  }

  @UseGuards(JwtAuthGuard)
  @Post('saveComment')
  async saveComment(@Body() commentDTO: CommentDTO): Promise<void> {
    await this.contractService.saveComment(commentDTO);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getComments')
  async getContractComments(@Query() commentID: any): Promise<Comment[]> {
    return await this.contractService.getContractComments(commentID.ID);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContractByID')
  async getContractByID(@Query() query: any): Promise<Contract> {
    const contract: Contract = await this.contractService.getContractByID(query.ID, false);
    const resumes: Resume[] = await this.resumeService.getResumesByID(contract.resumes, false);
    contract.resumes = resumes;
    return contract;
  }

  @UseGuards(JwtAuthGuard)
  @Get('getContractByIDUser')
  async getContractByIDUser(@Query() contractID: any, @Req() request: any): Promise<Contract> {
    let userID = request.user.userID;
    const contract: Contract = await this.contractService.getContractByID(contractID.ID, true, userID);
    const resumes: Resume[] = await this.resumeService.getResumesByID(contract.resumes, true);
    contract.resumes = resumes;
    return contract;
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContractsByResume')
  async getContractsByResume(@Query() resumeID: any): Promise<Contract[]> {
    const contracts: Contract[] = await this.contractService.getContractsByResume(resumeID.ID);
    return contracts;
  }

  @UseGuards(JwtAuthGuard)
  @Get('getContractsByUserID')
  async getContractsByUserID(@Query() query: any, @Req() request: any): Promise<GetUserContractsDTO> {
      return await this.contractService.getContractsByUserID(request.user.userID, request.user.username, query.ID, query.displayDomainContract);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContracts')
  async getAllContracts(@Query() filter: Filter): Promise<FilterList<Contract>> {
    return await this.contractService.getContracts(filter);
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Put('update')
  async updateContract(@Body() contract: Contract): Promise<Contract> {
    const updatedContract = await this.contractService.update(contract);
    this.socketService.emitContractUpdateEvent(contract);
    return updatedContract;
  }

  @UseGuards(JwtAuthGuard)
  @Post('contractStateReply')
  async confirmContractState(@Body() contractStateReplyDTO: ContractStateReplyDTO, @Req() request: any): Promise<Contract> {
    const updatedContract = await this.contractService.confirmContract(contractStateReplyDTO.contract, request.user.userID, contractStateReplyDTO.isAccepted);
    this.contractService.getContractByID(contractStateReplyDTO.contract.ID, false).then((contract) => { this.socketService.emitContractUpdateEvent(contract) });
    return updatedContract;
  }

  @UseGuards(JwtAuthGuard)
  @Post('requestRenewal')
  async requestRenewal(@Body() contract: Contract, @Req() request: any): Promise<Contract> {
    const updatedContract = await this.contractService.requestRenewal(contract, request.user.userID);
    this.contractService.getContractByID(contract.ID, false).then((contract) => { this.socketService.emitContractUpdateEvent(contract) });
    return updatedContract;
  }

  @Delete('delete')
  async deleteContract(@Body() contract: Contract): Promise<void>{
    const updatedContract = await this.contractService.delete(contract.ID);
    return updatedContract;
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getContractStatuses')
  async getAllStatuses(): Promise<Status[]> {
    return await this.contractService.getAllStatuses();
  }

  @UseGuards(JwtAuthGuard)
  @Get('getAllUserStatuses')
  async getAllUserStatuses(): Promise<Status[]> {
    return await this.contractService.getAllUserStatuses();
  }

}
