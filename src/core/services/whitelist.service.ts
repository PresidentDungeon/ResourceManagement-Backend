import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IWhitelistService } from "../primary-ports/application-services/whitelist.service.interface";
import { WhitelistDomainEntity } from "../../infrastructure/data-source/postgres/entities/whitelist.domain.entity";
import { Whitelist } from "../models/whitelist";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";
import { BadRequestError, EntityNotFoundError, InternalServerError } from "../../infrastructure/error-handling/errors";

@Injectable()
export class WhitelistService implements IWhitelistService {

  whitelistRegex: RegExp = new RegExp('^@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+[a-zA-Z]{2,}))$');

  constructor(@InjectRepository(WhitelistDomainEntity) private whitelistRepository: Repository<WhitelistDomainEntity>) {}

  async addWhitelist(whitelist: Whitelist): Promise<Whitelist> {

    this.verifyWhitelist(whitelist);

    const existingWhitelistCount = await this.whitelistRepository.count({where: `"domain" ILIKE '${whitelist.domain}'`});

    if(existingWhitelistCount > 0)
    {
      throw new EntityNotFoundError('Whitelist with the same domain already exists');
    }

    try{
      const createdWhitelist = await this.whitelistRepository.create(whitelist);
      const savedWhitelist = await this.whitelistRepository.save(createdWhitelist);
      return savedWhitelist;
    }
    catch (e) {
      throw new BadRequestError('Internal server error');
    }
  }

  async deleteWhitelist(whitelist: Whitelist): Promise<void> { //
    const foundWhitelist = await this.getWhitelistByID(whitelist.ID);

    this.verifyWhitelist(foundWhitelist);

    try{
      let updatedWhitelist = await this.whitelistRepository.delete(foundWhitelist);
    }
    catch (e){
      throw new BadRequestError('Internal server error');
    }

  }

  async getWhitelists(filter: Filter): Promise<FilterList<Whitelist>> {

    if (filter == null || filter == undefined) {
      throw new BadRequestError("Invalid filter entered");
    }

    if (filter.itemsPrPage == null || filter.itemsPrPage == undefined || filter.itemsPrPage <= 0) {
      throw new BadRequestError("Invalid items pr. page entered");
    }

    if (filter.currentPage == null || filter.currentPage == undefined || filter.currentPage < 0) {
      throw new BadRequestError("Invalid current page entered");
    }
    let qb = this.whitelistRepository.createQueryBuilder("whitelist");

    if (filter.domain != null && filter.domain !== "") {
      qb.andWhere(`domain ILIKE :domain`, { domain: `%${filter.domain}%` });
    }

    qb.orderBy('whitelist.ID')


    qb.offset((filter.currentPage) * filter.itemsPrPage);
    qb.limit(filter.itemsPrPage);

    const result = await qb.getMany();
    const count = await qb.getCount();

    const filterList: FilterList<Whitelist> = { list: result, totalItems: count };
    return filterList;
}


  async getWhitelistByID(ID: number): Promise<Whitelist> {

    if (ID == null || ID == undefined || ID <= 0) {
      throw new BadRequestError("Whitelist ID must be instantiated or valid");
    }

    let qb = this.whitelistRepository.createQueryBuilder("whitelist");
    qb.where('whitelist.ID = :whitelistID', { whitelistID: `${ID}`});
    const foundWhitelist: WhitelistDomainEntity = await qb.getOne();

    if (foundWhitelist == null) {
      throw new EntityNotFoundError("No whitelist registered with such ID");
    }
    return foundWhitelist;
  }

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
      throw new InternalServerError('Internal server error');
    }
  }

  verifyWhitelist(whiteList: Whitelist): void {
    if(whiteList == null) {throw new BadRequestError('Whitelist must be instantiated');}
    if(whiteList.ID == null || whiteList.ID < 0){throw new BadRequestError('Whitelist must have a valid ID')}
    if(whiteList.domain == null || !this.whitelistRegex.test(whiteList.domain)){throw new BadRequestError('Whitelist domain must be valid');}
  }

  async verifyUserWhitelist(username: string): Promise<boolean> {

    let indexOfAt = username.indexOf('@');
    if(indexOfAt == -1) {return false;}
    let domainName = username.slice(indexOfAt, username.length);

    let amountOfWhitelistDomains: number = await this.whitelistRepository.createQueryBuilder("whitelist")
      .andWhere(`whitelist.domain ILIKE :whitelist`, { whitelist: `${domainName}` }).getCount();

    return (amountOfWhitelistDomains > 0) ? true : false;
  }


}
