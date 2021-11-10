import { Injectable } from "@nestjs/common";
import { IContractService } from "../primary-ports/contract.service.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ContractEntity } from "../../infrastructure/data-source/postgres/entities/contract.entity";
import { Contract } from "../models/contract";
import { ContractorEntity } from "../../infrastructure/data-source/postgres/entities/contractor.entity";
import { Contractor } from "../models/contracter";
import { ContractorDTO } from "../../api/dtos/contractor.dto";

@Injectable()
export class ContractService implements IContractService{

  constructor(
    @InjectRepository(ContractEntity) private contractRepository: Repository<ContractEntity>,
    @InjectRepository(ContractorEntity) private contractorRepository: Repository<ContractorEntity>,
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
    catch (e) {console.log(e);throw new Error('Internal server error')}
  }

  async getContractByID(ID: number): Promise<Contract>{

    if(ID == null || ID <= 0){
      throw new Error('Contract ID must be instantiated or valid');
    }

    let qb = this.contractRepository.createQueryBuilder("contract");
    qb.leftJoinAndSelect('contract.users', 'users');
    qb.leftJoinAndSelect('contract.contractors', 'contractors');
    qb.andWhere(`contract.ID = :contractID`, { contractID: `${ID}`});
    const foundContract: ContractEntity = await qb.getOne();

    if(foundContract == null)
    {
      throw new Error('No contracts registered with such ID');
    }
    return foundContract;
  }

  async update(contract: Contract): Promise<Contract> {

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

  async getContractorCount(ID: number) {

    if(ID == null || ID <= 0){
      throw new Error('Contract ID must be instantiated or valid');
    }

    let qb = this.contractRepository.createQueryBuilder('contract');
    qb.leftJoin('contract.contractors', 'contractors');
    qb.andWhere('contractors.ID = :contractorID', {contractorID: `${ID}`});
    const amount = await qb.getCount();

    return amount;
  }

  //Missing test - should not be seen as implementation but general idea. Contractor layout is still unknown.
  async getContractorsCount(contracts: Contractor[]) {

    let contractorDTOArray: ContractorDTO[] = [{ID: 1, count: 0}, {ID: 2, count: 0}, {ID: 3, count: 0}, {ID: 4, count: 0}];
    const IDs = [1, 2, 3, 4];


    let qb = this.contractorRepository.createQueryBuilder('contractor');
    qb.leftJoin('contractor.contracts', 'contracts');
    qb.andWhere('contractor.ID IN (:...contractorIDs)', {contractorIDs: IDs});
    qb.select('contractor.ID', 'ID');
    qb.addSelect('COUNT(DISTINCT(contracts.ID)) as contracts');
    qb.groupBy('contractor.ID');

    console.log(await qb.getRawMany());

    const result = await qb.getRawMany();
    let convertedValues: ContractorDTO[] = result.map((value) => {return {ID: value.ID as number, count: Number.parseInt(value.contracts)}})
    console.log(convertedValues);

    contractorDTOArray.map((contractValue) => {const foundValue = convertedValues.find(item => item.ID == contractValue.ID); if(foundValue){contractValue.count = foundValue.count}});

    console.log(contractorDTOArray);
    return contractorDTOArray;
  }

  verifyContractEntity(contract: Contract) {
    if(contract == null) {throw new Error('Contract must be instantiated');}
    if(contract.ID == null || contract.ID < 0){throw new Error('Contract must have a valid ID')}
    if(contract.title == null || contract.title.trim().length == 0){throw new Error('Contract must have a valid title');}
    if(contract.status == null || contract.status.trim().length == 0){throw new Error('Contract must have a valid status');}
    if(contract.startDate == null ){throw new Error('Contract must contain a valid start date');}
    if(contract.endDate == null ){throw new Error('Contract must contain a valid end date');}
    if(contract.endDate.getTime() - contract.startDate.getTime() < 0 ){throw new Error('Start date cannot be after end date');}
  }












}
