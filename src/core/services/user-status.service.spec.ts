import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserStatusService } from "./user-status.service";
import { UserStatusEntity } from "../../infrastructure/data-source/postgres/entities/user-status.entity";
import { Status } from "../models/status";
import theoretically from "jest-theories";
import { MockRepositories } from "../../infrastructure/error-handling/mock-repositories";
import { ContractStatusEntity } from "../../infrastructure/data-source/postgres/entities/contract-status.entity";

describe('UserStatusService', () => {
  let service: UserStatusService;
  let mockUserStatusRepository: Repository<UserStatusEntity>;

  let mockContractFactory = new MockRepositories();

  beforeEach(async () => {

    const MockUserStatusRepository = mockContractFactory.getMockRepository(UserStatusEntity);

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserStatusService, MockUserStatusRepository],
    }).compile();

    service = module.get<UserStatusService>(UserStatusService);
    mockUserStatusRepository = module.get<Repository<UserStatusEntity>>(getRepositoryToken(UserStatusEntity));
  });

  it('User status service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Mock user status repository should be defined', () => {
    expect(mockUserStatusRepository).toBeDefined();
  });

  //#region FindStatusByName

  it('Calling findStatusByName with invalid name returns error', async () => {

    let role: string = '';

    let errorStringToExcept: string = 'Status must be instantiated';

    await expect(service.findStatusByName(null)).rejects.toThrowError(errorStringToExcept);
    await expect(service.findStatusByName(undefined)).rejects.toThrowError(errorStringToExcept);
    await expect(service.findStatusByName(role)).rejects.toThrowError(errorStringToExcept);
    expect(mockUserStatusRepository.findOne).toHaveBeenCalledTimes(0);
  });

  it('Calling findStatusByName with valid name returns role', async () => {

    let status: string = 'Pending';
    let mockstatus: Status = {ID: 1, status: 'Pending'};

    jest.spyOn(mockUserStatusRepository, "findOne").mockResolvedValueOnce(mockstatus);

    await expect(await service.findStatusByName(status)).toBe(mockstatus);
    expect(mockUserStatusRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('Calling findStatusByName with valid name but without any results throws error', async () => {

    let status: string = 'Pending';
    let errorStringToExcept: string = 'The specified status could not be found';

    jest.spyOn(mockUserStatusRepository, "findOne").mockResolvedValueOnce(null);

    await expect(service.findStatusByName(status)).rejects.toThrowError(errorStringToExcept);
    expect(mockUserStatusRepository.findOne).toHaveBeenCalledTimes(1);
  });

  describe('Calling find user status by name finds role with inserted user status title', () => {

    let roleTitle: string;

    const theories = [
      { input: roleTitle = 'Pending'},
      { input: roleTitle = 'Active'},
      { input: roleTitle = 'Whitelisted'},
      { input: roleTitle = 'Disabled'},
    ];

    theoretically('Correct calls are performed', theories, async theory => {

      jest.spyOn(mockUserStatusRepository, 'findOne').mockImplementation(() => {let statusEntity: UserStatusEntity = {ID: 1, status: 'Pending'}; return new Promise(resolve => {resolve(statusEntity);});})

      await expect(await service.findStatusByName(theory.input)).resolves;
      expect(mockUserStatusRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockUserStatusRepository.findOne).toHaveBeenCalledWith({where: `"status" ILIKE '${theory.input}'`});
    })
  });

  //#endregion

  //#region GetStatuses

  it('Calling getStatuses returns all stored statuses', async () => {

    const statuses: Status[] = [
      {ID: 1, status: 'Pending'},
      {ID: 2, status: 'Active'},
    ]

    jest
      .spyOn(mockUserStatusRepository.createQueryBuilder(), 'getMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(statuses);});});

    let foundStatuses: Status[];

    await expect(foundStatuses = await service.getStatuses()).resolves;
    expect(mockUserStatusRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(foundStatuses).toBe(statuses);
  });

  //#endregion

});
