import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IStatusService } from "../primary-ports/status.service.interface";
import { Status } from "../models/status";
import { StatusEntity } from "../../infrastructure/data-source/postgres/entities/status.entity";

@Injectable()
export class StatusService implements IStatusService {

  constructor(@InjectRepository(StatusEntity) private statusRepository: Repository<StatusEntity>) {}

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
