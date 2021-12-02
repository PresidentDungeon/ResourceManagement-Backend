import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserStatusService } from "./user-status.service";
import { Status } from "../models/status";
import { ContractStatusService } from "./contract-status.service";
import { ContractStatusEntity } from "../../infrastructure/data-source/postgres/entities/contract-status.entity";
import { Contract } from "../models/contract";
import theoretically from "jest-theories";

describe('UserStatusService', () => {
  let service: ContractStatusService;
  let mockRepository: Repository<ContractStatusEntity>;

  beforeEach(async () => {

    const MockProvider = {
      provide: getRepositoryToken(ContractStatusEntity),
      useFactory: () => ({
        findOne: jest.fn(() => {let contractStatusEntity: ContractStatusEntity = {ID: 1, status: 'Draft'}; return new Promise(resolve => {resolve(contractStatusEntity);});}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const createQueryBuilder: any = {
      leftJoinAndSelect: () => createQueryBuilder,
      andWhere: jest.fn(() => createQueryBuilder),
      getOne: jest.fn(() => {}),
      getMany: jest.fn(() => {}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractStatusService, MockProvider],
    }).compile();

    service = module.get<ContractStatusService>(ContractStatusService);
    mockRepository = module.get<Repository<ContractStatusEntity>>(getRepositoryToken(ContractStatusEntity));
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

    let status: string = 'Draft';
    let mockstatus: Status = {ID: 1, status: 'Draft'};

    jest.spyOn(mockRepository, "findOne").mockResolvedValueOnce(mockstatus);

    await expect(await service.findStatusByName(status)).toBe(mockstatus);
    expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it('Calling findStatusByName with valid name but without any results throws error', async () => {

    let status: string = 'Draft';
    let errorStringToExcept: string = 'The specified status could not be found';

    jest.spyOn(mockRepository, "findOne").mockResolvedValueOnce(null);

    await expect(service.findStatusByName(status)).rejects.toThrowError(errorStringToExcept);
    expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
  });

  describe('Calling find status by name finds status with inserted status title', () => {

    let statusTitle: string;
    const theories = [
      { input: statusTitle = 'Pending review'},
      { input: statusTitle = 'Accepted'},
      { input: statusTitle = 'Declined'},
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
      {ID: 1, status: 'Draft'},
      {ID: 2, status: 'Pending review'},
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

  //#region GetUserStatus

  it('Calling get user statuses inserts correct andwhere statement', async () => {

    const storedStatuses: Status[] = [
      {ID: 3, status: 'Pending review'},
      {ID: 5, status: 'Accepted'},
      {ID: 7, status: 'Completed'},
    ]

    jest
      .spyOn(mockRepository.createQueryBuilder(), 'getMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedStatuses);});});

    let foundStatuses: Status[];

    await expect(foundStatuses = await service.getUserStatus()).resolves;
    expect(foundStatuses).toEqual(storedStatuses);
    expect(mockRepository.createQueryBuilder().andWhere).toHaveBeenCalledTimes(1);
    expect(mockRepository.createQueryBuilder().andWhere).toHaveBeenCalledWith('status.status IN (:...statuses)', {statuses: ['Pending review', 'Accepted', 'Completed']});
    expect(mockRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
  });

  //#endregion

});
