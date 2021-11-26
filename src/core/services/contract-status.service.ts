import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Status } from "../models/status";
import { IContractStatusService } from "../primary-ports/contract-status.service.interface";
import { ContractStatusEntity } from "../../infrastructure/data-source/postgres/entities/contract-status.entity";
import { Contract } from "../models/contract";

@Injectable()
export class ContractStatusService implements IContractStatusService {

  constructor(@InjectRepository(ContractStatusEntity) private statusRepository: Repository<ContractStatusEntity>) {}

  async findStatusByName(status: string): Promise<Status> {

    if(status == undefined || status == null || status.length <= 0)
    {
      throw 'Status must be instantiated';
    }

    const foundStatus = await this.statusRepository.findOne({where: `"status" ILIKE '${status}'`})

    if(foundStatus == null || foundStatus == undefined){throw 'The specified status could not be found'}
    return foundStatus;
  }

  async getStatuses(): Promise<Status[]> {
    let qb = this.statusRepository.createQueryBuilder("status");
    const status: Status[] = await qb.getMany();
    return status;
  }
}
