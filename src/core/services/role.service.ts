import { Injectable } from '@nestjs/common';
import { IRoleService } from "../primary-ports/role.service.interface";
import { Role } from "../models/role";
import { InjectRepository } from "@nestjs/typeorm";
import { RoleEntity } from "../../infrastructure/data-source/postgres/entities/role.entity";
import { Repository } from "typeorm";

@Injectable()
export class RoleService implements IRoleService {

  constructor(@InjectRepository(RoleEntity) private roleRepository: Repository<RoleEntity>) {}

  async findRoleByName(role: string): Promise<Role> {

    if(role == undefined || role == null || role.length <= 0)
    {
      throw 'Role must be instantiated';
    }

    const foundRole = await this.roleRepository.findOne({where: `"role" ILIKE '${role}'`})

    if(foundRole == null || foundRole == undefined){throw 'The specified role could not be found'}
    return foundRole;
  }
}
