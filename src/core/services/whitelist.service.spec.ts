import { Test, TestingModule } from '@nestjs/testing';
import { WhitelistService } from './whitelist.service';
import { Repository } from "typeorm";
import { WhitelistDomainEntity } from "../../infrastructure/data-source/postgres/entities/whitelist.domain.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ResumeRequestEntity } from "../../infrastructure/data-source/postgres/entities/resume-request.entity";
import { CommentEntity } from "../../infrastructure/data-source/postgres/entities/comment.entity";

describe('WhitelistService', () => {
  let service: WhitelistService;
  let mockWhitelistRepository: Repository<WhitelistDomainEntity>;

  beforeEach(async () => {

    const MockWhitelistRepository = {
      provide: getRepositoryToken(WhitelistDomainEntity),
      useFactory: () => ({
        save: jest.fn((resumeRequestEntity: ResumeRequestEntity) => { return new Promise(resolve => {resolve(resumeRequestEntity);});}),
        create: jest.fn((resumeRequestEntity: ResumeRequestEntity) => {return new Promise(resolve => {resolve(resumeRequestEntity);});}),
        execute: jest.fn(() => {}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const createQueryBuilder: any = {
      leftJoinAndSelect: jest.fn(() => createQueryBuilder),
      leftJoin: () => createQueryBuilder,
      andWhere: () => createQueryBuilder,
      select: () => createQueryBuilder,
      addSelect: () => createQueryBuilder,
      groupBy: () => createQueryBuilder,
      addGroupBy: () => createQueryBuilder,
      getOne: jest.fn(() => {}),
      getMany: jest.fn(() => {}),
      getRawOne: jest.fn(() => {}),
      getRawMany: jest.fn(() => {}),
      getCount: jest.fn(() => {}),
      offset: jest.fn(() => {}),
      limit: jest.fn(() => {}),
      orderBy: jest.fn(() => {}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WhitelistService, MockWhitelistRepository],
    }).compile();

    service = module.get<WhitelistService>(WhitelistService);
    mockWhitelistRepository = module.get<Repository<WhitelistDomainEntity>>(getRepositoryToken(WhitelistDomainEntity));
  });

  it('Whitelist service should be defined', () => {
    expect(service).toBeDefined();
  });
});
