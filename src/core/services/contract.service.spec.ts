import { Test, TestingModule } from '@nestjs/testing';
import { ContractService } from './contract.service';
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserEntity } from "../../infrastructure/data-source/postgres/entities/user.entity";
import { DeleteQueryBuilder, FindManyOptions, Repository } from "typeorm";
import { ContractEntity } from "../../infrastructure/data-source/postgres/entities/contract.entity";
import { ContractorEntity } from "../../infrastructure/data-source/postgres/entities/contractor.entity";
import { User } from "../models/user";
import theoretically from "jest-theories";
import { Contract } from "../models/contract";
import { Contractor } from "../models/contracter";
import { UserDTO } from "../../api/dtos/user.dto";

describe('ContractService', () => {
  let service: ContractService;
  let mockContractRepository: Repository<ContractEntity>;
  let mockContractorRepository: Repository<ContractorEntity>;
  let mockDeleteQueryBuilder: DeleteQueryBuilder<ContractEntity>;

  beforeEach(async () => {

    const MockContractRepository = {
      provide: getRepositoryToken(ContractEntity),
      useFactory: () => ({
        count: jest.fn((options: FindManyOptions<UserEntity>) => {}),
        save: jest.fn((userEntity: UserEntity) => { return new Promise(resolve => {resolve(userEntity);});}),
        create: jest.fn((userEntity: UserEntity) => {return new Promise(resolve => {resolve(userEntity);});}),
        execute: jest.fn(() => {}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const MockContractorRepository = {
      provide: getRepositoryToken(ContractorEntity),
      useFactory: () => ({
        count: jest.fn((options: FindManyOptions<UserEntity>) => {}),
        save: jest.fn((userEntity: UserEntity) => { return new Promise(resolve => {resolve(userEntity);});}),
        create: jest.fn((userEntity: UserEntity) => {return new Promise(resolve => {resolve(userEntity);});}),
        execute: jest.fn(() => {}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const createQueryBuilder: any = {
      leftJoinAndSelect: () => createQueryBuilder,
      leftJoin: () => createQueryBuilder,
      andWhere: () => createQueryBuilder,
      getOne: jest.fn(() => {}),
      getMany: jest.fn(() => {}),
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



    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractService, MockContractRepository, MockContractorRepository],
    }).compile();

    service = module.get<ContractService>(ContractService);
    mockContractRepository = module.get<Repository<ContractEntity>>(getRepositoryToken(ContractEntity));
    mockContractorRepository = module.get<Repository<ContractorEntity>>(getRepositoryToken(ContractorEntity));
    mockDeleteQueryBuilder = deleteQueryBuilder;
  });

  it('Contract service be defined', () => {
    expect(service).toBeDefined();
  });

  it('Mock contract repository should be defined', () => {
    expect(mockContractRepository).toBeDefined();
  });

  it('Mock contractor repository should be defined', () => {
    expect(mockContractorRepository).toBeDefined();
  });




  //#region AddContract

  it('Add invalid contract doesnt save contract to database', async () => {

    let contract: Contract = {ID: 0, title: '', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [], users: []};

    jest.spyOn(service, 'verifyContractEntity').mockImplementationOnce((contract: Contract) => {throw new Error('Contract must have a valid title')})

    let errorStringToExcept: string = 'Contract must have a valid title';

    await expect(service.addContract(contract)).rejects.toThrow(errorStringToExcept);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contract);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.save).toHaveBeenCalledTimes(0);
  });

  it('Error during save throws correct error message', async () => {

    let contract: Contract = {ID: 0, title: 'Mærsk', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [], users: []};

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

    let contract: Contract = {ID: 0, title: 'Mærsk', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [], users: []};
    let contractToSave: Contract = {ID: 1, title: 'Mærsk', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [], users: []};

    jest.spyOn(service, 'verifyContractEntity').mockImplementationOnce((contract: Contract) => {});
    jest.spyOn(mockContractRepository, 'save').mockImplementationOnce(() => {return new Promise(resolve => {resolve(contractToSave)});});

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
  });

  it('Find non-existing contract results in error', async () => {

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(null)});});

    let contractID: number = 1;
    let errorStringToExcept = 'No contracts registered with such ID';

    await expect(service.getContractByID(contractID)).rejects.toThrow(errorStringToExcept);
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
  });

  it('Find existing contract returns valid contract information', async () => {

    let storedContract: ContractEntity = {ID: 1, title: 'Contract title', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [], users: []};
    let contractID: number = 1;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedContract);});});

    let foundContract: Contract;

    await expect(foundContract = await service.getContractByID(contractID)).resolves;
    expect(foundContract).toStrictEqual(storedContract);
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region Update

  it('Update contract with invalid ID throws error', async () => {

    let contract: Contract = {ID: 0, title: 'Contract title', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [], users: []};
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

    let storedContract: Contract = {ID: 1, title: 'Contract title', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [{ID: 1}, {ID: 3}], users: []};
    let contractToUpdate: Contract = {ID: 1, title: '', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [{ID: 1}, {ID: 3}], users: []};

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

  it('Error while updating user throws error', async () => {

    let storedContract: Contract = {ID: 1, title: 'Contract title', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [], users: []};
    let contractToUpdate: Contract = {ID: 1, title: 'New contract title', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [], users: []};

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

  it('Updating user with valid data resolves correctly', async () => {

    let storedContract: Contract = {ID: 1, title: 'Contract title', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [{ID: 1}, {ID: 3}], users: []};
    let contractToUpdate: Contract = {ID: 1, title: 'New contract title', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [{ID: 1}, {ID: 3}], users: []};

    jest
      .spyOn(service, 'getContractByID')
      .mockImplementationOnce((ID: number) => {return new Promise(resolve => {return resolve(storedContract);});});

    jest
      .spyOn(service, 'verifyContractEntity')
      .mockImplementationOnce((contract: Contract) => {});

    await expect(await service.update(contractToUpdate)).resolves;
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

  //#region GetContractCount

  it('Get contract by ID fails on invalid ID', async () => {

    let ID: number = 0;
    let expectedErrorMessage: string = 'Contract ID must be instantiated or valid';

    await expect(service.getContractorCount(null)).rejects.toThrow(expectedErrorMessage);
    await expect(service.getContractorCount(ID)).rejects.toThrow(expectedErrorMessage);
    expect(mockContractRepository.createQueryBuilder).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(0);
  });

  describe('Get contract count amount', () => {

    let contract: Contract = {ID: 1, title: 'Contract one', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [{ID: 1}, {ID: 3}], users: []};
    let contract2: Contract = {ID: 2, title: 'Contract two', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [{ID: 2}, {ID: 1}], users: []};
    let contract3: Contract = {ID: 3, title: 'Contract three', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [{ID: 5}, {ID: 7}, {ID: 2}, {ID: 9}], users: []};
    let contract4: Contract = {ID: 4, title: 'Contract four', status: 'Draft', startDate: new Date(), endDate: new Date(), contractors: [{ID: 1}], users: []};

    let contracts: Contract[] = [contract, contract2, contract3, contract4];

    const theories = [
      { contractorID: 1, expectedAmount: 3 },
      { contractorID: 2, expectedAmount: 2 },
      { contractorID: 9, expectedAmount: 1 },
      { contractorID: 8, expectedAmount: 0 },
    ];

    theoretically('The right error message is thrown to the fitting error', theories, async theory => {

      jest.spyOn(mockContractRepository.createQueryBuilder(), 'getCount').mockImplementationOnce(() => {
        let count: number = 0;
        contracts.forEach((contract) => {contract.contractors.forEach((contractor) => {if(contractor.ID == theory.contractorID){count++;}})})
        return new Promise(resolve => {resolve(count)});
      });

      await expect(await service.getContractorCount(theory.contractorID)).toBe(theory.expectedAmount);
      expect(mockContractRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);
    })
  });

  //#endregion

  //#region VerifyContractEntity

  describe('Error handling with invalid contract', () => {
    let contract: Contract;
    const theories = [
      { input: contract = null, expected: "Contract must be instantiated" },

      { input: contract = {ID: null, title: 'Mærsk Offshore', status: 'Draft', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []},
        expected: "Contract must have a valid ID" },
      { input: contract = {ID: -1, title: 'Mærsk Offshore', status: 'Draft', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []},
        expected: "Contract must have a valid ID" },
      { input: contract = {ID: 0, title: null, status: 'Draft', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []},
        expected: "Contract must have a valid title" },
      { input: contract = {ID: 0, title: '', status: 'Draft', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []},
        expected: "Contract must have a valid title" },
      { input: contract = {ID: 0, title: ' ', status: 'Draft', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []},
        expected: "Contract must have a valid title" },
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: null, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []},
        expected: "Contract must have a valid status" },
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: '', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []},
        expected: "Contract must have a valid status" },
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: ' ', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []},
        expected: "Contract must have a valid status" },
      { input: contract = {ID: 0, title: 'Mærsk Offshore', status: 'Draft', startDate: null, endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []},
        expected: "Contract must contain a valid start date" },
      { input: contract = {ID: 0, title: 'Mærsk Offshore', status: 'Draft', startDate: new Date('2021-11-08T21:00:00'), endDate: null, users: [], contractors: []},
        expected: "Contract must contain a valid end date" },
      { input: contract = {ID: 0, title: 'Mærsk Offshore', status: 'Draft', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-11-08T20:00:00'), users: [], contractors: []},
        expected: "Start date cannot be after end date" },
    ];

    theoretically('The right error message is thrown to the fitting error', theories, theory => {
      expect(() => { service.verifyContractEntity(theory.input as Contract); }).toThrow(theory.expected);
    })
  });

  describe('Validation of valid contract does not throw errors', () => {
    let contract: Contract;
    const theories = [
      { input: contract = {ID: 0, title: 'Mærsk Offshore', status: 'Draft', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: 'Draft', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []}},
      { input: contract = {ID: 1, title: ' Mærsk Offshore ', status: 'Draft', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: ' Accepted ', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: ' Accepted ', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], contractors: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: ' Accepted ', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [{ID: 1, username: 'User@gmail.com', salt: 'saltValue', password: 'passwordValue', verificationCode: 'verificationCode', status: {ID: 1, status: 'Pending'}, role: {ID: 1, role: 'User'}}], contractors: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', status: ' Accepted ', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [{ID: 1, username: 'User@gmail.com', salt: 'saltValue', password: 'passwordValue', verificationCode: 'verificationCode', status: {ID: 1, status: 'Pending'}, role: {ID: 1, role: 'User'}}], contractors: [{ID: 1}]}},
    ];

    theoretically('No error message is thrown uding contract validation', theories, theory => {
      expect(service.verifyContractEntity(theory.input)).resolves;
    })
  });

  //#endregion

});
