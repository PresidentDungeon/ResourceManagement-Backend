import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IWhitelistService } from "../primary-ports/whitelist.service.interface";
import { WhitelistDomainEntity } from "../../infrastructure/data-source/postgres/entities/whitelist.domain.entity";
import { Whitelist } from "../models/whitelist";

@Injectable()
export class WhitelistService implements IWhitelistService {

  whitelistRegex: RegExp = new RegExp('^@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');

  constructor(@InjectRepository(WhitelistDomainEntity) private whitelistRepository: Repository<WhitelistDomainEntity>) {}

  //Missing test
  async addWhitelist(whitelist: Whitelist): Promise<Whitelist> {

    this.verifyWhitelist(whitelist);

    const existingWhitelistCount = await this.whitelistRepository.count({where: `"domain" ILIKE '${whitelist.domain}'`});

    if(existingWhitelistCount > 0)
    {
      throw new Error('Whitelist with the same domain already exists');
    }

    try{
      const createdWhitelist = await this.whitelistRepository.create(whitelist);
      const savedWhitelist = await this.whitelistRepository.save(createdWhitelist);
      return savedWhitelist;
    }
    catch (e) {
      throw new Error('Internal server error');
    }
  }

  //Missing test
  deleteWhitelist(whiteList: Whitelist): Promise<Whitelist> {
    return Promise.resolve(undefined);
  }

  //Missing test
  getWhitelistByID(ID: number): Promise<Whitelist> {
    return Promise.resolve(undefined);
  }

  //Missing test
  updateWhitelist(whiteList: Whitelist): Promise<Whitelist> {
    return Promise.resolve(undefined);
  }

  //Missing test
  verifyWhitelist(whiteList: Whitelist): void {
    if(whiteList == null) {throw new Error('Whitelist must be instantiated');}
    if(whiteList.ID == null || whiteList.ID < 0){throw new Error('Whitelist must have a valid ID')}
    if(whiteList.domain == null || !this.whitelistRegex.test(whiteList.domain)){throw new Error('Whitelist domain must be valid');}
  }

  //Missing test
  verifyUserWhitelist(username: string): Promise<boolean> {





    return Promise.resolve(false);
  }


}
