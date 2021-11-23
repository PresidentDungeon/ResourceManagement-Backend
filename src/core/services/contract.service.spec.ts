import { Test, TestingModule } from '@nestjs/testing';
import { ContractService } from './contract.service';
import { getRepositoryToken } from "@nestjs/typeorm";
import { DeleteQueryBuilder, FindManyOptions, Repository } from "typeorm";
import { ContractEntity } from "../../infrastructure/data-source/postgres/entities/contract.entity";
import { ResumeEntity } from "../../infrastructure/data-source/postgres/entities/resume.entity";
import { User } from "../models/user";
import theoretically from "jest-theories";
import { Contract } from "../models/contract";
import { Resume } from "../models/resume";
import { IContractStatusServiceProvider } from "../primary-ports/contract-status.service.interface";
import { ContractStatusEntity } from "../../infrastructure/data-source/postgres/entities/contract-status.entity";
import { ContractStatusService } from "./contract-status.service";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";
import { Status } from "../models/status";
import { IResumeServiceProvider } from "../primary-ports/resume.service.interface";

describe('ContractService', () => {
  let service: ContractService;
  let mockContractRepository: Repository<ContractEntity>;
  let mockResumeRepository: Repository<ResumeEntity>;
  let mockDeleteQueryBuilder: DeleteQueryBuilder<ContractEntity>;
  let mockStatusService: ContractStatusService

  beforeEach(async () => {

    const MockContractRepository = {
      provide: getRepositoryToken(ContractEntity),
      useFactory: () => ({
        count: jest.fn((options: FindManyOptions<ContractEntity>) => {}),
        save: jest.fn((contractEntity: ContractEntity) => { return new Promise(resolve => {resolve(contractEntity);});}),
        create: jest.fn((contractEntity: ContractEntity) => {return new Promise(resolve => {resolve(contractEntity);});}),
        execute: jest.fn(() => {}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const MockResumeRepository = {
      provide: getRepositoryToken(ResumeEntity),
      useFactory: () => ({
        count: jest.fn((options: FindManyOptions<ResumeEntity>) => {}),
        save: jest.fn((contractorEntity: ResumeEntity) => { return new Promise(resolve => {resolve(contractorEntity);});}),
        create: jest.fn((contractorEntity: ResumeEntity) => {return new Promise(resolve => {resolve(contractorEntity);});}),
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
      getOne: jest.fn(() => {}),
      getMany: jest.fn(() => {}),
      getRawMany: jest.fn(() => {}),
      getCount: jest.fn(() => {}),
      offset: jest.fn(() => {}),
      limit: jest.fn(() => {}),
      delete: jest.fn(() => {return deleteQueryBuilder}),
    };

    const deleteQueryBuilder: any = {
      set: () => deleteQueryBuilder,
      where: () => deleteQueryBuilder,
      from: () => deleteQueryBuilder,
      andWhere: () => deleteQueryBuilder,
      execute: jest.fn(() => {}),
    };

    const StatusServiceMock = {
      provide: IContractStatusServiceProvider,
      useFactory: () => ({
        findStatusByName: jest.fn((name: string) => {let statusEntity: ContractStatusEntity = {ID: 1, status: name}; return statusEntity;}),
        getStatuses: jest.fn(() => {let statusEntities: ContractStatusEntity[] = [{ID: 1, status: 'Draft'}, {ID: 2, status: 'Pending review'}]; return new Promise(resolve => {resolve(statusEntities);});}),
      })
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractService, MockContractRepository, MockResumeRepository, StatusServiceMock],
    }).compile();

    service = module.get<ContractService>(ContractService);
    mockContractRepository = module.get<Repository<ContractEntity>>(getRepositoryToken(ContractEntity));
    mockResumeRepository = module.get<Repository<ResumeEntity>>(getRepositoryToken(ResumeEntity));
    mockDeleteQueryBuilder = deleteQueryBuilder;
    mockStatusService = module.get<ContractStatusService>(IContractStatusServiceProvider);
  });

  it('Contract service be defined', () => {
    expect(service).toBeDefined();
  });

  it('Mock contract repository should be defined', () => {
    expect(mockContractRepository).toBeDefined();
  });

  it('Mock contractor repository should be defined', () => {
    expect(mockResumeRepository).toBeDefined();
  });

  it('Mock status service Should be defined', () => {
    expect(mockStatusService).toBeDefined();
  });

  //#region AddContract

  it('Add invalid contract doesnt save contract to database', async () => {

    let contract: Contract = {ID: 0, title: '', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: []};

    jest.spyOn(service, 'verifyContractEntity').mockImplementationOnce((contract: Contract) => {throw new Error('Contract must have a valid title')})

    let errorStringToExcept: string = 'Contract must have a valid title';

    await expect(service.addContract(contract)).rejects.toThrow(errorStringToExcept);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contract);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.save).toHaveBeenCalledTimes(0);
  });

  it('Error during save throws correct error message', async () => {

    let contract: Contract = {ID: 0, title: 'Mærsk', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: []};

    jest.spyOn(service, 'verifyContractEntity').mockImplementationOnce((contract: Contract) => {});
    jest.spyOn(mockContractRepository, 'save').mockImplementationOnce(() => {throw new Error()});

    let errorStringToExcept: string = 'Internal server error';

    await expect(service.addContract(contract)).rejects.toThrow(errorStringToExcept);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contract);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.create).toHaveBeenCalledWith(contract);
    expect(mockContractRepository.save).toHaveBeenCalledTimes(1);
  });

  it('Saving contract resolves correctly', async () => {

    let contract: Contract = {ID: 0, title: 'Mærsk', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: []};
    let contractSaveReturns: ContractEntity = {ID: 1, title: 'Mærsk', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: []};

    jest.spyOn(service, 'verifyContractEntity').mockImplementationOnce((contract: Contract) => {});
    jest.spyOn(mockContractRepository, 'save').mockImplementationOnce(() => {return new Promise(resolve => {resolve(contractSaveReturns)});});

    let savedContract: Contract;

    await expect(savedContract = await service.addContract(contract)).resolves;
    expect(savedContract).not.toBe(contract);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contract);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.create).toHaveBeenCalledWith(contract);
    expect(mockContractRepository.save).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region GetContractByID

  it('Find contract with invalid ID results in error', async () => {

    let ID: number = 0;
    let errorStringToExcept = 'Contract ID must be instantiated or valid';

    await expect(service.getContractByID(null)).rejects.toThrow(errorStringToExcept);
    await expect(service.getContractByID(ID)).rejects.toThrow(errorStringToExcept);
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.createQueryBuilder().leftJoinAndSelect).toHaveBeenCalledTimes(0);
  });

  it('Find non-existing contract results in error', async () => {

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(null)});});

    let contractID: number = 1;
    let errorStringToExcept = 'No contracts registered with such ID';

    await expect(service.getContractByID(contractID)).rejects.toThrow(errorStringToExcept);
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().leftJoinAndSelect).toHaveBeenCalledTimes(2);
  });

  it('Find existing contract returns valid contract information', async () => {

    let storedContract: ContractEntity = {ID: 1, title: 'Contract title', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: []};
    let contractID: number = 1;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedContract);});});

    let foundContract: Contract;

    await expect(foundContract = await service.getContractByID(contractID)).resolves;
    expect(foundContract).toStrictEqual(storedContract);
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().leftJoinAndSelect).toHaveBeenCalledTimes(2);
  });

  it('Get contract by ID selects users if redacted is false', async () => {

    let storedContract: ContractEntity = {ID: 1, title: 'Contract title', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: []};
    let contractID: number = 1;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedContract);});});

    let foundContract: Contract;

    await expect(foundContract = await service.getContractByID(contractID, false)).resolves;
    expect(foundContract).toStrictEqual(storedContract);
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().leftJoinAndSelect).toHaveBeenCalledTimes(3);
  });

  //#endregion

  //#region GetContractByUserID

  it('Find contract with invalid userID results in error', async () => {

    let ID: number = 0;
    let errorStringToExcept = 'User ID must be instantiated or valid';

    await expect(service.getContractByUserID(null)).rejects.toThrow(errorStringToExcept);
    await expect(service.getContractByUserID(ID)).rejects.toThrow(errorStringToExcept);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(0);
  });

  it('Find existing contracts by user ID returns valid contract information', async () => {

    let storedContract1: ContractEntity = {ID: 1, title: 'Contract title', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: []};
    let storedContract2: ContractEntity = {ID: 2, title: 'Contract title', status: {ID: 3, status: 'Accepted'}, startDate: new Date(), endDate: new Date(), resumes: [], users: []};
    let userID: number = 1;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve([storedContract1, storedContract2]);});});

    let foundContract: Contract[];

    await expect(foundContract = await service.getContractByUserID(userID)).resolves;
    expect(foundContract).toStrictEqual([storedContract1, storedContract2]);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
  });


  //#endregion

  //#region GetContracts

  describe('Get contracts throws error when inserting invalid filter',  () => {

    let filter: Filter;
    let expectedError: string;

    const theories = [
      { filter: filter = null, expectedError: 'Invalid filter entered'},
      { filter: filter = undefined, expectedError: 'Invalid filter entered'},
      { filter: filter = {itemsPrPage: null, currentPage: 1}, expectedError: 'Invalid items pr. page entered'},
      { filter: filter = {itemsPrPage: undefined, currentPage: 1}, expectedError: 'Invalid items pr. page entered'},
      { filter: filter = {itemsPrPage: 0, currentPage: 1}, expectedError: 'Invalid items pr. page entered'},
      { filter: filter = {itemsPrPage: Number.MIN_SAFE_INTEGER, currentPage: 1}, expectedError: 'Invalid items pr. page entered'},
      { filter: filter = {itemsPrPage: 1, currentPage: null}, expectedError: 'Invalid current page entered'},
      { filter: filter = {itemsPrPage: 1, currentPage: undefined}, expectedError: 'Invalid current page entered'},
      { filter: filter = {itemsPrPage: 1, currentPage: -1}, expectedError: 'Invalid current page entered'},
      { filter: filter = {itemsPrPage: 1, currentPage: Number.MIN_SAFE_INTEGER}, expectedError: 'Invalid current page entered'},
    ];

    theoretically('The correct error message is thrown during user filtering', theories,  async theory => {
      await expect(service.getContracts(theory.filter)).rejects.toThrow(theory.expectedError);
      expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(0);
      expect(mockContractRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(0);
    });
  });

  it('Get contracts returns valid filterList', async () => {

    let storedContracts: ContractEntity[] = [
      {ID: 1, title: 'Mærsk Contract', startDate: new Date(), endDate: new Date(), status: {ID: 1, status: 'Draft'}, resumes: [], users: []},
      {ID: 2, title: 'O&J Brand og Sikring', startDate: new Date(), endDate: new Date(), status: {ID: 2, status: 'Pending review'}, resumes: [], users: []},
      {ID: 3, title: 'Slik for voksne', startDate: new Date(), endDate: new Date(), status: {ID: 1, status: 'Draft'}, resumes: [], users: []},
    ]

    let expectedTotalListSize: number = 3;
    let expectedListSize: number = 3;

    let expectedList: ContractEntity[] = [
      {ID: 1, title: 'Mærsk Contract', startDate: new Date(), endDate: new Date(), status: {ID: 1, status: 'Draft'}, resumes: [], users: []},
      {ID: 2, title: 'O&J Brand og Sikring', startDate: new Date(), endDate: new Date(), status: {ID: 2, status: 'Pending review'}, resumes: [], users: []},
      {ID: 3, title: 'Slik for voksne', startDate: new Date(), endDate: new Date(), status: {ID: 1, status: 'Draft'}, resumes: [], users: []},
    ]

    let filter: Filter = {currentPage: 1, itemsPrPage: 2};

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getMany')
      .mockImplementation(() => {return new Promise(resolve => {resolve(storedContracts);});});

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getCount')
      .mockImplementation(() => {return new Promise(resolve => {resolve(storedContracts.length);});});

    let filterList: FilterList<Contract>;
    await expect(filterList = await service.getContracts(filter)).resolves;
    expect(filterList.list).toStrictEqual(expectedList);
    expect(filterList.list.length).toBe(expectedListSize)
    expect(filterList.totalItems).toBe(expectedTotalListSize);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);

    jest.spyOn(mockContractRepository, 'createQueryBuilder').mockReset();
  });

  it('Get contracts returns valid filterList when offset', async () => {

    let storedContracts: ContractEntity[] = [
      {ID: 1, title: 'Mærsk Contract', startDate: new Date(), endDate: new Date(), status: {ID: 1, status: 'Draft'}, resumes: [], users: []},
      {ID: 2, title: 'O&J Brand og Sikring', startDate: new Date(), endDate: new Date(), status: {ID: 2, status: 'Pending review'}, resumes: [], users: []},
      {ID: 3, title: 'Slik for voksne', startDate: new Date(), endDate: new Date(), status: {ID: 1, status: 'Draft'}, resumes: [], users: []},
    ]

    let expectedTotalListSize: number = 3;
    let expectedListSize: number = 1;

    let expectedList: Contract[] = [
      {ID: 3, title: 'Slik for voksne', startDate: new Date(), endDate: new Date(), status: {ID: 1, status: 'Draft'}, resumes: [], users: []}
    ]

    let filter: Filter = {currentPage: 2, itemsPrPage: 1};
    let offsetValue: number;
    let limitValue: number;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'offset')
      .mockImplementation((offset?: number) => {offsetValue = offset; return null;});

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'limit')
      .mockImplementation((limit?: number) => {limitValue = limit; return null;});

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getMany')
      .mockImplementation(() => {
        let storedValue: ContractEntity[] = [...storedContracts];
        for(let i = 0; i < offsetValue; i++){storedValue.shift();}
        let resizedValue = storedValue.slice(0, limitValue);
        return new Promise(resolve => {resolve(resizedValue);});});

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getCount')
      .mockImplementation(() => {return new Promise(resolve => {resolve(storedContracts.length);});});


    let filterList: FilterList<Contract>;
    await expect(filterList = await service.getContracts(filter)).resolves;
    expect(filterList.list).toStrictEqual(expectedList);
    expect(filterList.list.length).toBe(expectedListSize)
    expect(filterList.totalItems).toBe(expectedTotalListSize);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);

    jest.spyOn(mockContractRepository, 'createQueryBuilder').mockReset();
  });

  it('Get contracts returns valid filterList when limit', async () => {

    let storedContracts: ContractEntity[] = [
      {ID: 1, title: 'Mærsk Contract', startDate: new Date(), endDate: new Date(), status: {ID: 1, status: 'Draft'}, resumes: [], users: []},
      {ID: 2, title: 'O&J Brand og Sikring', startDate: new Date(), endDate: new Date(), status: {ID: 2, status: 'Pending review'}, resumes: [], users: []},
      {ID: 3, title: 'Slik for voksne', startDate: new Date(), endDate: new Date(), status: {ID: 1, status: 'Draft'}, resumes: [], users: []},
    ]

    let expectedTotalListSize: number = 3;
    let expectedListSize: number = 2;

    let expectedList: ContractEntity[] = [
      {ID: 1, title: 'Mærsk Contract', startDate: new Date(), endDate: new Date(), status: {ID: 1, status: 'Draft'}, resumes: [], users: []},
      {ID: 2, title: 'O&J Brand og Sikring', startDate: new Date(), endDate: new Date(), status: {ID: 2, status: 'Pending review'}, resumes: [], users: []},
    ]

    let filter: Filter = {currentPage: 0, itemsPrPage: 2};
    let offsetValue: number;
    let limitValue: number;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'offset')
      .mockImplementation((offset?: number) => {offsetValue = offset; return null;});

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'limit')
      .mockImplementation((limit?: number) => {limitValue = limit; return null;});

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getMany')
      .mockImplementation(() => {
        let storedValue: ContractEntity[] = [...storedContracts];
        for(let i = 0; i < offsetValue; i++){storedValue.shift();}
        let resizedValue = storedValue.slice(0, limitValue);
        return new Promise(resolve => {resolve(resizedValue);});});

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getCount')
      .mockImplementation(() => {return new Promise(resolve => {resolve(storedContracts.length);});});


    let filterList: FilterList<Contract>;
    await expect(filterList = await service.getContracts(filter)).resolves;
    expect(filterList.list).toStrictEqual(expectedList);
    expect(filterList.list.length).toBe(expectedListSize)
    expect(filterList.totalItems).toBe(expectedTotalListSize);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);

    jest.spyOn(mockContractRepository, 'createQueryBuilder').mockReset();
  });

  //#endregion

  //#region ConfirmContract

  it('Updating contract with isAccepted status calls find status by name of type accepted', async () => {

    let contract: Contract = {ID: 1, title: 'Contract', status: {ID: 2, status: 'Pending review'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: []};
    let storedStatus: Status = {ID: 3, status: 'Accepted'}
    let isAccepted: boolean = true;

    jest.spyOn(service, 'update').mockImplementationOnce((contract) => {return new Promise(resolve => {resolve(contract);});});
    jest.spyOn(mockStatusService, 'findStatusByName').mockImplementationOnce((status) => {return new Promise(resolve => {resolve(storedStatus);});});

    let updatedContract: Contract;

    await expect(updatedContract = await service.confirmContract(contract, isAccepted)).resolves;
    expect(updatedContract).toBeDefined();
    expect(updatedContract.status).toBe(storedStatus);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Accepted');
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(contract);
  });

  it('Updating contract with isAccepted status of false calls find status by name of type Declined', async () => {

    let contract: Contract = {ID: 1, title: 'Contract', status: {ID: 2, status: 'Pending review'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: []};
    let storedStatus: Status = {ID: 3, status: 'Rejected'}
    let isAccepted: boolean = false;

    jest.spyOn(service, 'update').mockImplementationOnce((contract) => {return new Promise(resolve => {resolve(contract);});});
    jest.spyOn(mockStatusService, 'findStatusByName').mockImplementationOnce((status) => {return new Promise(resolve => {resolve(storedStatus);});});

    let updatedContract: Contract;

    await expect(updatedContract = await service.confirmContract(contract, isAccepted)).resolves;
    expect(updatedContract).toBeDefined();
    expect(updatedContract.status).toBe(storedStatus);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Rejected');
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(contract);
  });

  //#endregion

  //#region Update

  it('Update contract with invalid ID throws error', async () => {

    let contract: Contract = {ID: 0, title: 'Contract title', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: []};
    let expectedErrorMessage: string = 'Contract ID must be instantiated or valid'

    jest
      .spyOn(service, 'getContractByID')
      .mockImplementationOnce((ID: number) => {throw new Error('Contract ID must be instantiated or valid');});

    jest.spyOn(service, 'verifyContractEntity').mockImplementationOnce(() => {});

    await expect(service.update(contract)).rejects.toThrow(expectedErrorMessage);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contract.ID);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.save).toHaveBeenCalledTimes(0);
  });

  it('Update contract with invalid data throws error', async () => {

    let storedContract: Contract = {ID: 1, title: 'Contract title', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: []};
    let contractToUpdate: Contract = {ID: 1, title: '', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: []};

    jest
      .spyOn(service, 'getContractByID')
      .mockImplementationOnce((ID: number) => {return new Promise(resolve => {return resolve(storedContract);});});

    jest
      .spyOn(service, 'verifyContractEntity')
      .mockImplementationOnce((contract: Contract) => {throw new Error('Contract must have a valid title')});

    let expectedErrorMessage: string = 'Contract must have a valid title'

    await expect(service.update(contractToUpdate)).rejects.toThrow(expectedErrorMessage);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contractToUpdate.ID);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contractToUpdate);
    expect(mockContractRepository.save).toHaveBeenCalledTimes(0);
  });

  it('Error while updating contract throws error', async () => {

    let storedContract: Contract = {ID: 1, title: 'Contract title', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: []};
    let contractToUpdate: Contract = {ID: 1, title: 'New contract title', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: []};

    jest
      .spyOn(service, 'getContractByID')
      .mockImplementationOnce((ID: number) => {return new Promise(resolve => {return resolve(storedContract);});});

    jest
      .spyOn(service, 'verifyContractEntity')
      .mockImplementationOnce((contract: Contract) => {});

    jest
      .spyOn(mockContractRepository, 'save')
      .mockImplementationOnce((contract: Contract) => {throw new Error});

    let expectedErrorMessage: string = 'Internal server error'

    await expect(service.update(contractToUpdate)).rejects.toThrow(expectedErrorMessage);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contractToUpdate.ID);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contractToUpdate);
    expect(mockContractRepository.save).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.save).toHaveBeenCalledWith(contractToUpdate);
  });

  it('Updating contract with valid data resolves correctly', async () => {

    let storedContract: Contract = {ID: 1, title: 'Contract title', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: []};
    let contractToUpdate: Contract = {ID: 1, title: 'New contract title', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: []};

    jest
      .spyOn(service, 'getContractByID')
      .mockImplementationOnce((ID: number) => {return new Promise(resolve => {return resolve(storedContract);});});

    jest
      .spyOn(service, 'verifyContractEntity')
      .mockImplementationOnce((contract: Contract) => {});

    let updatedContract: Contract;

    await expect(updatedContract = await service.update(contractToUpdate)).resolves;
    expect(updatedContract).toStrictEqual(contractToUpdate);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contractToUpdate.ID);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contractToUpdate);
    expect(mockContractRepository.save).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.save).toHaveBeenCalledWith(contractToUpdate);
  });

  //#endregion

  //#region Delete

  it('Delete contract by ID fails on invalid ID', async () => {

    let ID: number = 0;
    let expectedErrorMessage: string = 'Contract ID must be instantiated or valid';

    await expect(service.delete(null)).rejects.toThrow(expectedErrorMessage);
    await expect(service.delete(ID)).rejects.toThrow(expectedErrorMessage);
    expect(mockContractRepository.createQueryBuilder().delete).toHaveBeenCalledTimes(0);
  });

  it('Error during delete throws correct error', async () => {

    let ID: number = 1;
    let expectedErrorMessage: string = 'Internal server error';


    jest.spyOn(mockDeleteQueryBuilder, 'execute').mockImplementationOnce(() => {throw new Error()});
    await expect(service.delete(ID)).rejects.toThrow(expectedErrorMessage);
    expect(mockContractRepository.createQueryBuilder().delete).toHaveBeenCalledTimes(1);

    jest.restoreAllMocks();
  });

  it('Delete valid ID is successful', async () => {

    let ID: number = 1;

    await expect(await service.delete(ID)).resolves;
    expect(mockContractRepository.createQueryBuilder().delete).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().delete().execute).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region VerifyContractEntity

  describe('Error handling with invalid contract', () => {
    let contract: Contract;
    const theories = [
      { input: contract = null, expected: "Contract must be instantiated" },

      { input: contract = {ID: null, title: 'Mærsk Offshore', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []},
        expected: "Contract must have a valid ID" },
      { input: contract = {ID: -1, title: 'Mærsk Offshore', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []},
        expected: "Contract must have a valid ID" },
      { input: contract = {ID: 0, title: null, status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []},
        expected: "Contract must have a valid title" },
      { input: contract = {ID: 0, title: '', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []},
        expected: "Contract must have a valid title" },
      { input: contract = {ID: 0, title: ' ', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []},
        expected: "Contract must have a valid title" },
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: null, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []},
        expected: "Contract must have a valid status" },
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: {ID: 0, status: ''}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []},
        expected: "Contract must have a valid status" },
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: {ID: -5, status: ' '}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []},
        expected: "Contract must have a valid status" },
      { input: contract = {ID: 0, title: 'Mærsk Offshore', status: {ID: 1, status: 'Draft'}, startDate: null, endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []},
        expected: "Contract must contain a valid start date" },
      { input: contract = {ID: 0, title: 'Mærsk Offshore', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: null, users: [], resumes: []},
        expected: "Contract must contain a valid end date" },
      { input: contract = {ID: 0, title: 'Mærsk Offshore', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-11-08T20:00:00'), users: [], resumes: []},
        expected: "Start date cannot be after end date" },
    ];

    theoretically('The right error message is thrown to the fitting error', theories, theory => {
      expect(() => { service.verifyContractEntity(theory.input as Contract); }).toThrow(theory.expected);
    })
  });

  describe('Validation of valid contract does not throw errors', () => {
    let contract: Contract;
    const theories = [
      { input: contract = {ID: 0, title: 'Mærsk Offshore', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []}},
      { input: contract = {ID: 1, title: ' Mærsk Offshore ', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: {ID: 2, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: {ID: 2, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: {ID: 2, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [{ID: 1, username: 'User@gmail.com', salt: 'saltValue', password: 'passwordValue', status: {ID: 1, status: 'Pending'}, role: {ID: 1, role: 'User'}}], resumes: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: {ID: 2, status: 'Accepted '}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [{ID: 1, username: 'User@gmail.com', salt: 'saltValue', password: 'passwordValue', status: {ID: 1, status: 'Pending'}, role: {ID: 1, role: 'User'}}], resumes: [{ID: 1}]}},
    ];

    theoretically('No error message is thrown using contract validation', theories, theory => {
      expect(service.verifyContractEntity(theory.input)).resolves;
    })
  });

  //#endregion

  //#region GetAllStatuses

  it('Get all contract statuses calls status service', async () => {
    let result;

    await expect(result = await service.getAllStatuses()).resolves;
    await expect(result).toBeDefined();
    expect(mockStatusService.getStatuses).toHaveBeenCalledTimes(1);
  });

  //#endregion

});
