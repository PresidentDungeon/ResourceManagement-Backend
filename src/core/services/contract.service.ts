import { Inject, Injectable } from "@nestjs/common";
import { IContractService } from "../primary-ports/contract.service.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ContractEntity } from "../../infrastructure/data-source/postgres/entities/contract.entity";
import { Contract } from "../models/contract";
import { ResumeEntity } from "../../infrastructure/data-source/postgres/entities/resume.entity";
import { Resume } from "../models/resume";
import { IUserStatusService, IUserStatusServiceProvider } from "../primary-ports/user-status.service.interface";
import {
  IContractStatusService,
  IContractStatusServiceProvider
} from "../primary-ports/contract-status.service.interface";
import { Role } from "../models/role";
import { Status } from "../models/status";

@Injectable()
export class ContractService implements IContractService{

  constructor(
    @InjectRepository(ContractEntity) private contractRepository: Repository<ContractEntity>,
    @InjectRepository(ResumeEntity) private contractorRepository: Repository<ResumeEntity>,
    @Inject(IContractStatusServiceProvider) private statusService: IContractStatusService
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

  async getContractByID(ID: number): Promise<Contract>{

    if(ID == null || ID <= 0){
      throw new Error('Contract ID must be instantiated or valid');
    }

    let qb = this.contractRepository.createQueryBuilder("contract");
    qb.leftJoinAndSelect('contract.users', 'users');
    qb.leftJoinAndSelect('contract.resumes', 'resumes');
    qb.andWhere(`contract.ID = :contractID`, { contractID: `${ID}`});
    const foundContract: ContractEntity = await qb.getOne();

    if(foundContract == null)
    {
      throw new Error('No contracts registered with such ID');
    }
    return foundContract;
  }

  async update(contract: Contract): Promise<Contract> {
    contract.startDate = new Date(contract.startDate);
    contract.endDate = new Date(contract.endDate);
    await this.getContractByID(contract.ID);
    this.verifyContractEntity(contract);

    try{
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

  async getResumeCount(ID: number): Promise<number> {

    if(ID == null || ID <= 0){
      throw new Error('Resume ID must be instantiated or valid');
    }

    let draftStatus: Status = await this.statusService.findStatusByName('Draft');
    let pendingStatus: Status = await this.statusService.findStatusByName('Pending review');
    let statusIDs: number[] = [draftStatus.ID, pendingStatus.ID];

    let qb = this.contractRepository.createQueryBuilder('contract');
    qb.leftJoin('contract.resumes', 'resumes');
    qb.leftJoin('contract.status', 'status');
    qb.andWhere('status.ID IN (:...statusIDs)', {statusIDs: statusIDs});
    qb.andWhere('resumes.ID = :resumeID', {resumeID: `${ID}`});
    const amount = await qb.getCount();

    return amount;
  }

  async getResumesCount(resumes: Resume[]): Promise<Resume[]> {

    let resumeIDs: number[] = [];
    resumes.map((resume) => {resumeIDs.push(resume.ID); resume.count = 0});

    let draftStatus: Status = await this.statusService.findStatusByName('Draft');
    let pendingStatus: Status = await this.statusService.findStatusByName('Pending review');
    let statusIDs: number[] = [draftStatus.ID, pendingStatus.ID];

    let qb = this.contractorRepository.createQueryBuilder('resume');
    qb.leftJoin('resume.contracts', 'contracts');
    qb.leftJoin('contracts.status', 'status');
    qb.andWhere('status.ID IN (:...statusIDs)', {statusIDs: statusIDs});
    qb.andWhere('resume.ID IN (:...resumeIDs)', {resumeIDs: resumeIDs});
    qb.select('resume.ID', 'ID');
    qb.addSelect('COUNT(DISTINCT(contracts.ID)) as contracts');
    qb.groupBy('resume.ID');

    const result = await qb.getRawMany();
    let convertedValues: Resume[] = result.map((value) => {return {ID: value.ID as number, count: Number.parseInt(value.contracts)}})

    resumes.map((resumeValue) => {const foundValue = convertedValues.find(item => item.ID == resumeValue.ID); if(foundValue){resumeValue.count = foundValue.count}});
    return resumes;
  }

  verifyContractEntity(contract: Contract) {
    if(contract == null) {throw new Error('Contract must be instantiated');}
    if(contract.ID == null || contract.ID < 0){throw new Error('Contract must have a valid ID')}
    if(contract.title == null || contract.title.trim().length == 0){throw new Error('Contract must have a valid title');}
    if(contract.status == null || contract.status.ID <= 0){throw new Error('Contract must have a valid status');}
    if(contract.startDate == null ){throw new Error('Contract must contain a valid start date');}
    if(contract.endDate == null ){throw new Error('Contract must contain a valid end date');}
    if(contract.endDate.getTime() - contract.startDate.getTime() < 0 ){throw new Error('Start date cannot be after end date');}
  }

  async getAllStatuses(): Promise<Status[]>{
    return await this.statusService.getStatuses();
  }

}
