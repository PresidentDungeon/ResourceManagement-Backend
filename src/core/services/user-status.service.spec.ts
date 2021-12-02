import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserStatusService } from "./user-status.service";
import { UserStatusEntity } from "../../infrastructure/data-source/postgres/entities/user-status.entity";
import { Status } from "../models/status";
import theoretically from "jest-theories";

describe('UserStatusService', () => {
  let service: UserStatusService;
  let mockRepository: Repository<UserStatusEntity>;

  beforeEach(async () => {

    const MockProvider = {
      provide: getRepositoryToken(UserStatusEntity),
      useFactory: () => ({
        findOne: jest.fn(() => {let statusEntity: UserStatusEntity = {ID: 1, status: 'Pending'}; return new Promise(resolve => {resolve(statusEntity);});}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const createQueryBuilder: any = {
      leftJoinAndSelect: () => createQueryBuilder,
      andWhere: () => createQueryBuilder,
      getOne: jest.fn(() => {}),
      getMany: jest.fn(() => {}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [UserStatusService, MockProvider],
    }).compile();

    service = module.get<UserStatusService>(UserStatusService);
    mockRepository = module.get<Repository<UserStatusEntity>>(getRepositoryToken(UserStatusEntity));
  });

  it('service should be defined', () => {
    expect(service).toBeDefined();
  });

  it('mock repository should be defined', () => {
    expect(mockRepository).toBeDefined();
  });

  //#region FindStatusByName

  it('Calling findStatusByName with invalid name returns error', async () => {

    let role: string = '';

    let errorStringToExcept: string = 'Status must be instantiated';

    await expect(service.findStatusByName(null)).rejects.toThrowError(errorStringToExcept);
    await expect(service.findStatusByName(undefined)).rejects.toThrowError(errorStringToExcept);
    await expect(service.findStatusByName(role)).rejects.toThrowError(errorStringToExcept);
    expect(mockRepository.findOne).toHaveBeenCalledTimes(0);
  });

  it('Calling findStatusByName with valid name returns role', async () => {

    let status: string = 'Pending';
    let mockstatus: Status = {ID: 1, status: 'Pending'};

    jest.spyOn(mockRepository, "findOne").mockResolvedValueOnce(mockstatus);

    await expect(await service.findStatusByName(status)).toBe(mockstatus);
    expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('Calling findStatusByName with valid name but without any results throws error', async () => {

    let status: string = 'Pending';
    let errorStringToExcept: string = 'The specified status could not be found';

    jest.spyOn(mockRepository, "findOne").mockResolvedValueOnce(null);

    await expect(service.findStatusByName(status)).rejects.toThrowError(errorStringToExcept);
    expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
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

      await expect(await service.findStatusByName(theory.input)).resolves;
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockRepository.findOne).toHaveBeenCalledWith({where: `"status" ILIKE '${theory.input}'`});
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
      .spyOn(mockRepository.createQueryBuilder(), 'getMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(statuses);});});

    let foundStatuses: Status[];

    await expect(foundStatuses = await service.getStatuses()).resolves;
    expect(mockRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(foundStatuses).toBe(statuses);
  });

  //#endregion

});
