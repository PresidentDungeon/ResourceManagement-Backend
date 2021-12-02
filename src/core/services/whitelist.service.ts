import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IWhitelistService } from "../primary-ports/whitelist.service.interface";
import { WhitelistDomainEntity } from "../../infrastructure/data-source/postgres/entities/whitelist.domain.entity";
import { Whitelist } from "../models/whitelist";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";
import { UserDTO } from "../../api/dtos/user.dto";

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
  async deleteWhitelist(whitelist: Whitelist): Promise<void> { //
    const foundWhitelist = await this.getWhitelistByID(whitelist.ID);

    this.verifyWhitelist(foundWhitelist);

    try{
      let updatedWhitelist = await this.whitelistRepository.delete(foundWhitelist);
    }
    catch (e){
      throw new Error('Internal server error');
    }

  }

  async getWhitelist(filter: Filter): Promise<FilterList<Whitelist>> {

    if (filter == null || filter == undefined) {
      throw new Error("Invalid filter entered");
    }

    if (filter.itemsPrPage == null || filter.itemsPrPage == undefined || filter.itemsPrPage <= 0) {
      throw new Error("Invalid items pr. page entered");
    }

    if (filter.currentPage == null || filter.currentPage == undefined || filter.currentPage < 0) {
      throw new Error("Invalid current page entered");
    }
    let qb = this.whitelistRepository.createQueryBuilder("whitelist");

    if (filter.domain != null && filter.domain !== "") {
      qb.andWhere(`domain ILIKE :domain`, { domain: `%${filter.domain}%` });
    }

    qb.offset((filter.currentPage) * filter.itemsPrPage);
    qb.limit(filter.itemsPrPage);

    const result = await qb.getMany();
    const count = await qb.getCount();

    const filterList: FilterList<Whitelist> = { list: result, totalItems: count };
    return filterList;
}


  //Missing test
  async getWhitelistByID(ID: number): Promise<Whitelist> {

    if (ID == null || ID == undefined || ID <= 0) {
      throw new Error("Whitelist ID must be instantiated or valid");
    }

    let qb = this.whitelistRepository.createQueryBuilder("whitelist");
    qb.where('whitelist.ID = :whitelistID', { whitelistID: `${ID}`});
    const foundWhitelist: WhitelistDomainEntity = await qb.getOne();

    if (foundWhitelist == null) {
      throw new Error("No whitelist registered with such ID");
    }
    return foundWhitelist;
  }

  //Missing test
  async updateWhitelist(whitelist: Whitelist): Promise<Whitelist> {

    const foundWhitelist = await this.getWhitelistByID(whitelist.ID);
    foundWhitelist.ID = whitelist.ID;
    foundWhitelist.domain = whitelist.domain;

    this.verifyWhitelist(foundWhitelist);

    try{
      let updatedWhitelist = await this.whitelistRepository.save(foundWhitelist);
      return updatedWhitelist;
    }
    catch (e){
      throw new Error('Internal server error');
    }
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
