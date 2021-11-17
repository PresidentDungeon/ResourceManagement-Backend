import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Status } from "../models/status";
import { UserStatusEntity } from "../../infrastructure/data-source/postgres/entities/user-status.entity";
import { IUserStatusService } from "../primary-ports/user-status.service.interface";

@Injectable()
export class UserStatusService implements IUserStatusService {

  constructor(@InjectRepository(UserStatusEntity) private statusRepository: Repository<UserStatusEntity>) {}

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
