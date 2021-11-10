import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { StatusService } from "./status.service";
import { StatusEntity } from "../../infrastructure/data-source/postgres/entities/status.entity";
import { Status } from "../models/status";

describe('StatusService', () => {
  let service: StatusService;
  let mockRepository: Repository<StatusEntity>;

  beforeEach(async () => {

    const MockProvider = {
      provide: getRepositoryToken(StatusEntity),
      useFactory: () => ({
        findOne: jest.fn(() => {let statusEntity: StatusEntity = {ID: 1, status: 'Pending'}; return new Promise(resolve => {resolve(statusEntity);});}),
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
      providers: [StatusService, MockProvider],
    }).compile();

    service = module.get<StatusService>(StatusService);
    mockRepository = module.get<Repository<StatusEntity>>(getRepositoryToken(StatusEntity));
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

    await expect(service.findStatusByName(null)).rejects.toEqual(errorStringToExcept);
    await expect(service.findStatusByName(undefined)).rejects.toEqual(errorStringToExcept);
    await expect(service.findStatusByName(role)).rejects.toEqual(errorStringToExcept);
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
    let mockStatus: Status = {ID: 1, status: 'Active'};
    let errorStringToExcept: string = 'The specified status could not be found';

    jest.spyOn(mockRepository, "findOne").mockResolvedValueOnce(null);

    await expect(service.findStatusByName(status)).rejects.toEqual(errorStringToExcept);
    expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
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
