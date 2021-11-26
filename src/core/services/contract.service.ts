import { Inject, Injectable } from "@nestjs/common";
import { IContractService } from "../primary-ports/contract.service.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ContractEntity } from "../../infrastructure/data-source/postgres/entities/contract.entity";
import { Contract } from "../models/contract";
import { IContractStatusService, IContractStatusServiceProvider } from "../primary-ports/contract-status.service.interface";
import { Status } from "../models/status";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";
import { ResumeRequestEntity } from "../../infrastructure/data-source/postgres/entities/resume-request.entity";

@Injectable()
export class ContractService implements IContractService{

  constructor(
    @InjectRepository(ContractEntity) private contractRepository: Repository<ContractEntity>,
    @InjectRepository(ResumeRequestEntity) private resumeRequestRepository: Repository<ResumeRequestEntity>,
    @Inject(IContractStatusServiceProvider) private statusService: IContractStatusService,
  ) {}

  async addContract(contract: Contract): Promise<Contract> {

    contract.startDate = new Date(contract.startDate);
    contract.endDate = new Date(contract.endDate);

    this.verifyContractEntity(contract);
    const newContract = await this.contractRepository.create(contract);

    try{
      const savedContract = await this.contractRepository.save(newContract);
      return savedContract;
    }
    catch (e) {throw new Error('Internal server error')}
  }

  async addRequestContract(contract: Contract): Promise<Contract> {

    contract.startDate = new Date(contract.startDate);
    contract.endDate = new Date(contract.endDate);

    let status: Status = await this.statusService.findStatusByName('Request');
    contract.status = status;

    this.verifyContractEntity(contract);

    const resumeRequests = this.resumeRequestRepository.create(contract.resumeRequests);
    await this.resumeRequestRepository.save(resumeRequests);
    contract.resumeRequests = resumeRequests;

    const newContract = await this.contractRepository.create(contract);

    try{
      const savedContract = await this.contractRepository.save(newContract);
      return savedContract;
    }
    catch (e) {throw new Error('Internal server error')}
  }

  async getContractByID(ID: number, redact?: boolean): Promise<Contract>{

    if(ID == null || ID <= 0){
      throw new Error('Contract ID must be instantiated or valid');
    }

    let qb = this.contractRepository.createQueryBuilder("contract");
    if(redact != null && !redact){qb.leftJoinAndSelect('contract.users', 'users');}
    qb.leftJoinAndSelect('contract.status', 'status');
    qb.leftJoinAndSelect('contract.resumes', 'resumes');
    qb.leftJoinAndSelect('contract.resumeRequests', 'resumeRequests');
    qb.andWhere(`contract.ID = :contractID`, { contractID: `${ID}`});
    const foundContract: Contract = await qb.getOne();

    if(foundContract == null)
    {
      throw new Error('No contracts registered with such ID');
    }

    await this.verifyContractStatuses([foundContract]);

    return foundContract;
  }

  async getContractByUserID(ID: number) {

    if(ID == null || ID <= 0){
      throw new Error('User ID must be instantiated or valid');
    }

    let qb = this.contractRepository.createQueryBuilder("contract");
    qb.leftJoin('contract.users', 'users');
    qb.andWhere(`users.ID = :userID`, { userID: `${ID}`});
    qb.leftJoinAndSelect('contract.status', 'status');
    qb.andWhere(`status.status != :status`, { status: 'Rejected'})

    const foundContract: ContractEntity[] = await qb.getMany();
    await this.verifyContractStatuses(foundContract);
    return foundContract;
  }

  async getContracts(filter: Filter): Promise<FilterList<Contract>> {

    if(filter == null || filter == undefined){
      throw new Error('Invalid filter entered');
    }

    if(filter.itemsPrPage == null || filter.itemsPrPage == undefined || filter.itemsPrPage <= 0){
      throw new Error('Invalid items pr. page entered');
    }

    if(filter.currentPage == null || filter.currentPage == undefined || filter.currentPage < 0){
      throw new Error('Invalid current page entered');
    }

    let qb = this.contractRepository.createQueryBuilder("contract");
    qb.leftJoinAndSelect('contract.status', 'status');
    qb.leftJoin('contract.users', 'users');

    if(filter.name != null && filter.name !== '')
    {
      qb.andWhere(`contract.title ILIKE :title`, { title: `%${filter.name}%` });
    }

    if(filter.contractUser != null && filter.contractUser !== '')
    {
      qb.andWhere(`users.username ILIKE :contractUser`, { contractUser: `%${filter.contractUser}%` });
    }

    if(filter.statusID != null && filter.statusID > 0)
    {
      qb.andWhere(`status.ID = :statusID`, { statusID: `${filter.statusID}` });
    }

    if(filter.sorting != null && filter.sorting === 'ASC' || filter.sorting != null && filter.sorting === 'DESC')
    {
      if(filter.sortingType != null && filter.sortingType === 'ALF')
      {
        qb.orderBy('contract.title', filter.sorting);
      }
      if(filter.sortingType != null && filter.sortingType === 'ADDED')
      {
        qb.orderBy('contract.ID', filter.sorting);
      }
    }

    qb.offset((filter.currentPage) * filter.itemsPrPage);
    qb.limit(filter.itemsPrPage);

    const result = await qb.getMany();
    const count = await qb.getCount();

    await this.verifyContractStatuses(result);

    const filterList: FilterList<Contract> = {list: result, totalItems: count};
    return filterList;
  }

  async confirmContract(contract: Contract, isAccepted: boolean): Promise<Contract>{

    const storedContract: Contract = await this.getContractByID(contract.ID, false);

    if(storedContract.status.status.toLowerCase() != 'pending review'){
      throw new Error('Contract is not pending review and cannot be accepted or declined.');
    }

    contract.dueDate = new Date(contract.dueDate);
    let currentDate: Date = new Date();

    if(contract.dueDate.getTime() < currentDate.getTime()){
      throw new Error('The validation window for this contract is expired and cannot be accepted or declined');
    }

    let status: Status = await ((isAccepted) ? this.statusService.findStatusByName("Accepted") : this.statusService.findStatusByName("Rejected"));
    contract.status = status;
    contract.dueDate = null;
    const updatedContract = await this.update(contract);
    return updatedContract;
  }

  async requestRenewal(contract: Contract): Promise<Contract>{

    const storedContract: Contract = await this.getContractByID(contract.ID, false);

    if(storedContract.status.status.toLowerCase() != 'expired'){
      throw new Error('Contract is not expired and cannot be requested for renewal');
    }

    let pendingStatus: Status = await this.statusService.findStatusByName("Draft");
    contract.status = pendingStatus;
    const updatedContract = await this.update(contract);
    return updatedContract;
  }

  async update(contract: Contract): Promise<Contract> {
    contract.startDate = new Date(contract.startDate);
    contract.endDate = new Date(contract.endDate);
    await this.getContractByID(contract.ID);
    this.verifyContractEntity(contract);

    try{
      await this.resumeRequestRepository.createQueryBuilder().delete()
        .where("contractID = :contractID", {contractID: `${contract.ID}`}).execute();

      const resumeRequests = this.resumeRequestRepository.create(contract.resumeRequests);
      await this.resumeRequestRepository.save(resumeRequests);
      contract.resumeRequests = resumeRequests;

      const savedContract: Contract = await this.contractRepository.save(contract);
      return savedContract;
    }
    catch (e) {throw new Error('Internal server error')}
  }

  async delete(ID: number) {

    if(ID == null || ID <= 0){
      throw new Error('Contract ID must be instantiated or valid');
    }

    try{
      await this.contractRepository.createQueryBuilder().delete().from(ContractEntity).andWhere(`ID = :ID`, { ID: `${ID}`}).execute();
    }
    catch (e) {
      throw new Error('Internal server error')
    }
  }

  verifyContractEntity(contract: Contract) {
    if(contract == null) {throw new Error('Contract must be instantiated');}
    if(contract.ID == null || contract.ID < 0){throw new Error('Contract must have a valid ID')}
    if(contract.title == null || contract.title.trim().length == 0){throw new Error('Contract must have a valid title');}
    if(contract.description == null || contract.description.length > 500){throw new Error('Contract must have a valid description under 500 characters');}
    if(contract.status == null || contract.status.ID <= 0){throw new Error('Contract must have a valid status');}
    if(contract.startDate == null ){throw new Error('Contract must contain a valid start date');}
    if(contract.endDate == null ){throw new Error('Contract must contain a valid end date');}
    if(contract.endDate.getTime() - contract.startDate.getTime() < 0 ){throw new Error('Start date cannot be after end date');}
  }

  async verifyContractStatuses(contracts: Contract[]): Promise<Contract[]>{

    const expiredStatus: Status = await this.statusService.findStatusByName('Expired');

    contracts.map((contract) => {
      if(contract.status.status.toLowerCase() == 'pending review' && contract.dueDate && contract.dueDate.getTime() < new Date().getTime()){
        contract.status = expiredStatus
        this.contractRepository.createQueryBuilder().update(ContractEntity).set({status: expiredStatus, dueDate: null}).where("ID = :contractID", {contractID: contract.ID}).execute();}
    });

    return contracts;
  }

  async getAllStatuses(): Promise<Status[]>{
    return await this.statusService.getStatuses();
  }

}
