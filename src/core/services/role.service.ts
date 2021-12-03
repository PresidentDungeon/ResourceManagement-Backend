import { Injectable } from '@nestjs/common';
import { IRoleService } from "../primary-ports/role.service.interface";
import { Role } from "../models/role";
import { InjectRepository } from "@nestjs/typeorm";
import { RoleEntity } from "../../infrastructure/data-source/postgres/entities/role.entity";
import { Repository } from "typeorm";
import { BadRequestError, EntityNotFoundError } from "../../infrastructure/error-handling/errors";

@Injectable()
export class RoleService implements IRoleService {

  constructor(@InjectRepository(RoleEntity) private roleRepository: Repository<RoleEntity>) {}

  async findRoleByName(role: string): Promise<Role> {
    if(role == undefined || role == null || role.length <= 0) {throw new BadRequestError('Role must be instantiated');}
    const foundRole = await this.roleRepository.findOne({where: `"role" ILIKE '${role}'`})

    if(foundRole == null || foundRole == undefined){throw new EntityNotFoundError('The specified role could not be found')}
    return foundRole;
  }

  async getRoles(): Promise<Role[]> {
    let qb = this.roleRepository.createQueryBuilder("role");
    const roles: Role[] = await qb.getMany();
    return roles;
  }
}
