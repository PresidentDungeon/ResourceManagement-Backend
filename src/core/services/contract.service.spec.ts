import { Test, TestingModule } from '@nestjs/testing';
import { ContractService } from './contract.service';
import { getRepositoryToken } from "@nestjs/typeorm";
import { Connection, DeleteQueryBuilder, EntityManager, FindManyOptions, Repository } from "typeorm";
import { ContractEntity } from "../../infrastructure/data-source/postgres/entities/contract.entity";
import { User } from "../models/user";
import theoretically from "jest-theories";
import { Contract } from "../models/contract";
import { IContractStatusServiceProvider } from "../primary-ports/contract-status.service.interface";
import { ContractStatusEntity } from "../../infrastructure/data-source/postgres/entities/contract-status.entity";
import { ContractStatusService } from "./contract-status.service";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";
import { Status } from "../models/status";
import { ResumeRequestEntity } from "../../infrastructure/data-source/postgres/entities/resume-request.entity";
import { Comment } from "../models/comment";
import { CommentEntity } from "../../infrastructure/data-source/postgres/entities/comment.entity";
import { CommentDTO } from "../../api/dtos/comment.dto";

describe('ContractService', () => {
  let service: ContractService;
  let mockContractRepository: Repository<ContractEntity>;
  let mockResumeRequestRepository: Repository<ResumeRequestEntity>;
  let mockCommentRepository: Repository<CommentEntity>;
  let mockDeleteQueryBuilder: DeleteQueryBuilder<ContractEntity>;
  let mockStatusService: ContractStatusService;
  let connection: Connection;

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

    const MockResumeRequestRepository = {
      provide: getRepositoryToken(ResumeRequestEntity),
      useFactory: () => ({
        save: jest.fn((resumeRequestEntity: ResumeRequestEntity) => { return new Promise(resolve => {resolve(resumeRequestEntity);});}),
        create: jest.fn((resumeRequestEntity: ResumeRequestEntity) => {return new Promise(resolve => {resolve(resumeRequestEntity);});}),
        execute: jest.fn(() => {}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const MockCommentRepository = {
      provide: getRepositoryToken(CommentEntity),
      useFactory: () => ({
        create: jest.fn((commentEntity: CommentEntity) => { return new Promise(resolve => {resolve(commentEntity);});}),
        save: jest.fn((commentEntity: CommentEntity) => { return new Promise(resolve => {resolve(commentEntity);});}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    }

    const createQueryBuilder: any = {
      leftJoinAndSelect: jest.fn(() => createQueryBuilder),
      leftJoin: () => createQueryBuilder,
      select: () => createQueryBuilder,
      addSelect: () => createQueryBuilder,
      groupBy: () => createQueryBuilder,
      addGroupBy: () => createQueryBuilder,
      andWhere: jest.fn(() => createQueryBuilder),
      getOne: jest.fn(() => {}),
      getMany: jest.fn(() => {}),
      getRawOne: jest.fn(() => {}),
      getRawMany: jest.fn(() => {}),
      getCount: jest.fn(() => {}),
      offset: jest.fn(() => {}),
      limit: jest.fn(() => {}),
      orderBy: jest.fn(() => {}),
      update: jest.fn(() => {return updateQueryBuilder}),
      delete: jest.fn(() => {return deleteQueryBuilder}),
    };

    const deleteQueryBuilder: any = {
      set: () => deleteQueryBuilder,
      where: () => deleteQueryBuilder,
      from: () => deleteQueryBuilder,
      andWhere: () => deleteQueryBuilder,
      execute: jest.fn(() => {}),
    };

    const updateQueryBuilder: any = {
      set: () => deleteQueryBuilder,
      where: () => deleteQueryBuilder,
      execute: jest.fn(() => {}),
    };

    const StatusServiceMock = {
      provide: IContractStatusServiceProvider,
      useFactory: () => ({
        findStatusByName: jest.fn((name: string) => {let statusEntity: ContractStatusEntity = {ID: 1, status: name}; return statusEntity;}),
        getStatuses: jest.fn(() => {let statusEntities: ContractStatusEntity[] = [{ID: 1, status: 'Draft'}, {ID: 2, status: 'Pending review'}]; return new Promise(resolve => {resolve(statusEntities);});}),
      })
    }

    const mockConnection = {
      provide: Connection,
      useFactory: () => ({
        transaction: jest.fn((fn) => {return fn(mockedManager)}),
      })
    };

    const mockedManager = {
      save: jest.fn(() => {}),
      createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractService, MockContractRepository, MockResumeRequestRepository, MockCommentRepository, StatusServiceMock, mockConnection],
    }).compile();

    service = module.get<ContractService>(ContractService);
    mockContractRepository = module.get<Repository<ContractEntity>>(getRepositoryToken(ContractEntity));
    mockResumeRequestRepository = module.get<Repository<ResumeRequestEntity>>(getRepositoryToken(ResumeRequestEntity));
    mockCommentRepository = module.get<Repository<CommentEntity>>(getRepositoryToken(CommentEntity));
    mockDeleteQueryBuilder = deleteQueryBuilder;
    mockStatusService = module.get<ContractStatusService>(IContractStatusServiceProvider);
    connection = module.get<Connection>(Connection);

    let mockManager = mockedManager;
  });

  it('Contract service be defined', () => {
    expect(service).toBeDefined();
  });

  it('Mock contract repository should be defined', () => {
    expect(mockContractRepository).toBeDefined();
  });

  it('Mock comment repository should be defined', () => {
    expect(mockCommentRepository).toBeDefined();
  });

  it('Mock resume request repository should be defined', () => {
    expect(ResumeRequestEntity).toBeDefined();
  });

  it('Mock status service Should be defined', () => {
    expect(mockStatusService).toBeDefined();
  });

  it('Connection Should be defined', () => {
    expect(connection).toBeDefined();
  });

  //#region AddContract

  it('Add invalid contract doesnt save contract to database', async () => {

    let contract: Contract = {ID: 0, title: '', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};

    jest.spyOn(service, 'verifyContractEntity').mockImplementationOnce((contract: Contract) => {throw new Error('Contract must have a valid title')})

    let errorStringToExcept: string = 'Contract must have a valid title';

    await expect(service.addContract(contract)).rejects.toThrow(errorStringToExcept);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contract);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.save).toHaveBeenCalledTimes(0);
  });

  it('Error during save throws correct error message', async () => {

    let contract: Contract = {ID: 0, title: 'Mærsk', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};

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

    let contract: Contract = {ID: 0, title: 'Mærsk', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let contractSaveReturns: ContractEntity = {ID: 1, title: 'Mærsk', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};

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

  //#region AddRequestContract

  it('Add invalid contract doesnt save contract to database', async () => {

    let contract: Contract = {ID: 0, title: '', description: 'Some company', status: null, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};

    jest.spyOn(service, 'verifyContractEntity').mockImplementationOnce((contract: Contract) => {throw new Error('Contract must have a valid title')})
    const mockedManager = { save: jest.fn(() => {}) }
    connection.transaction = jest.fn().mockImplementation((fn) => {return fn(mockedManager)})

    let errorStringToExcept: string = 'Contract must have a valid title';

    await expect(service.addRequestContract(contract)).rejects.toThrow(errorStringToExcept);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Request');
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contract);
    expect(mockResumeRequestRepository.create).toHaveBeenCalledTimes(0);
    expect(mockedManager.save).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(0);
  });

  it('Error during save throw correct error message', async () => {

    let contract: Contract = {ID: 0, title: 'Mærsk', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: [{ID: 0, occupation: 'Electrician', count: 3}]};

    jest.spyOn(service, 'verifyContractEntity').mockImplementationOnce((contract: Contract) => {});

    const mockedManager = { save: jest.fn(() => {throw new Error('')}) }
    connection.transaction = jest.fn().mockImplementation((fn) => {return fn(mockedManager)})


    let errorStringToExcept: string = 'Internal server error';

    await expect(service.addRequestContract(contract)).rejects.toThrow(errorStringToExcept);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Request');
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contract);
    expect(mockResumeRequestRepository.create).toHaveBeenCalledTimes(1);
    expect(mockResumeRequestRepository.create).toHaveBeenCalledWith([{ID: 0, occupation: 'Electrician', count: 3}]);
    expect(mockedManager.save).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(0);
  });

  it('Saving contract resolves correctly', async () => {

    let contract: Contract = {ID: 0, title: 'Mærsk', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let contractSaveReturns: ContractEntity = {ID: 1, title: 'Mærsk', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};

    jest.spyOn(service, 'verifyContractEntity').mockImplementationOnce((contract: Contract) => {});
    const mockedManager = { save: jest.fn(() => {return new Promise(resolve => {resolve(contractSaveReturns)});}) }
    connection.transaction = jest.fn().mockImplementation((fn) => {return fn(mockedManager)})

    let savedContract: Contract;

    await expect(savedContract = await service.addRequestContract(contract)).resolves;
    expect(savedContract).not.toBe(contract);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Request');
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contract);
    expect(mockResumeRequestRepository.create).toHaveBeenCalledTimes(1);
    expect(mockResumeRequestRepository.create).toHaveBeenCalledWith([]);
    expect(mockedManager.save).toHaveBeenCalledTimes(2);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.create).toHaveBeenCalledWith(contract);
  });

  //#endregion

  //#region SaveComment

  it('Save comment calls comment repository', async () => {

    let commentDTO: CommentDTO = {comment: 'The contract was perfect and I really enjoyed the selected contractors!', contractID: 1, userID: 2};

    await expect(await service.saveComment(commentDTO)).resolves;
    expect(mockCommentRepository.create).toHaveBeenCalledTimes(1);
    expect(mockCommentRepository.create).toHaveBeenCalledWith(commentDTO);
    expect(mockCommentRepository.save).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region GetContractComments

  it('Find contract comments with invalid ID results in error', async () => {

    let ID: number = 0;
    let errorStringToExcept = 'Contract ID must be instantiated or valid';

    await expect(service.getContractComments(null)).rejects.toThrow(errorStringToExcept);
    await expect(service.getContractComments(ID)).rejects.toThrow(errorStringToExcept);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(0);
  });

  it('Find contract comments with valid ID returns comments', async () => {

    let ID: number = 1;
    let storedComments: CommentEntity[] = [{comment: 'A bit left to be desired. The contractors were a fine selection but I had a slight problem with Husam...', contract: JSON.parse('{"ID": "1"}'), user: JSON.parse('{"ID": "1"}')}, {comment: 'The contract went good as expected. Everything is fine.', contract: JSON.parse('{"ID": "1"}'), user: JSON.parse('{"ID": "2"}')}]

    jest
      .spyOn(mockCommentRepository.createQueryBuilder(), 'getMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedComments);});});

    let result: Comment[];

    await expect(result = await service.getContractComments(ID)).resolves;
    expect(result).toBe(storedComments);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region GetContractByID

  it('Find contract with invalid ID results in error', async () => {

    let ID: number = 0;
    let errorStringToExcept = 'Contract ID must be instantiated or valid';

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    await expect(service.getContractByID(null)).rejects.toThrow(errorStringToExcept);
    await expect(service.getContractByID(ID)).rejects.toThrow(errorStringToExcept);
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.createQueryBuilder().getRawOne).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.createQueryBuilder().leftJoinAndSelect).toHaveBeenCalledTimes(0);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(0);
  });

  it('Find contract with invalid personal ID results in error', async () => {

    let contractID: number = 1;
    let personalID: number = 0;

    let errorStringToExcept = 'Invalid user ID entered';

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    await expect(service.getContractByID(contractID, true, personalID)).rejects.toThrow(errorStringToExcept);
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.createQueryBuilder().getRawOne).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.createQueryBuilder().leftJoinAndSelect).toHaveBeenCalledTimes(0);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(0);
  });

  it('Find non-existing contract results in error', async () => {

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(null)});});

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    let contractID: number = 1;
    let errorStringToExcept = 'No contracts registered with such ID';



    await expect(service.getContractByID(contractID)).rejects.toThrow(errorStringToExcept);
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().getRawOne).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.createQueryBuilder().leftJoinAndSelect).toHaveBeenCalledTimes(3);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(0);
  });

  it('Find existing contract returns valid contract information', async () => {

    let storedContract: ContractEntity = {ID: 1, title: 'Contract title', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let contractID: number = 1;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedContract);});});

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    let foundContract: Contract;

    await expect(foundContract = await service.getContractByID(contractID)).resolves;
    expect(foundContract).toStrictEqual(storedContract);
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().getRawOne).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.createQueryBuilder().leftJoinAndSelect).toHaveBeenCalledTimes(3);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledWith([foundContract]);
  });

  it('Get contract by ID selects users if redacted is false', async () => {

    let storedContract: ContractEntity = {ID: 1, title: 'Contract title', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let contractID: number = 1;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedContract);});});

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    let foundContract: Contract;

    await expect(foundContract = await service.getContractByID(contractID, false)).resolves;
    expect(foundContract).toStrictEqual(storedContract);
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().getRawOne).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.createQueryBuilder().leftJoinAndSelect).toHaveBeenCalledTimes(4);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledWith([foundContract]);
  });

  it('Get contract by ID selects selects personal resume if valid personal ID is entered', async () => {

    let userID: number = 2;
    let personalComment: string = 'The contract went good as expected. Everything is fine.'
    let comments: CommentEntity[] = [{comment: 'A bit left to be desired. The contractors were a fine selection but I had a slight problem with Husam...', contract: JSON.parse('{"ID": "1"}'), user: JSON.parse('{"ID": "1"}')}, {comment: personalComment, contract: JSON.parse('{"ID": "1"}'), user: JSON.parse('{"ID": "2"}')}]

    let storedContract: ContractEntity = {ID: 1, title: 'Contract title', description: 'Some company', status: {ID: 4, status: 'Completed'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: [], comments: comments};
    let storedContractRaw: any = {ID: 1, title: 'Contract title', description: 'Some company', status: {ID: 4, status: 'Completed'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: [], comments: comments, personal_comment: personalComment};
    let contractID: number = 1;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedContract);});});

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getRawOne')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(storedContractRaw);});});

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    let foundContract: Contract;

    await expect(foundContract = await service.getContractByID(contractID, false, userID)).resolves;
    expect(foundContract).toStrictEqual(storedContract);
    expect(foundContract.personalComment).toEqual({comment: storedContractRaw.personal_comment});
    expect(mockContractRepository.createQueryBuilder().getOne).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().getRawOne).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().leftJoinAndSelect).toHaveBeenCalledTimes(4);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledWith([foundContract]);
  });

  //#endregion

  //#region GetContractByUserID

  it('Find contract with invalid userID results in error', async () => {

    let ID: number = 0;
    let statusID: number = 0;

    let errorStringToExcept = 'User ID must be instantiated or valid';

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    await expect(service.getContractByUserID(null, statusID)).rejects.toThrow(errorStringToExcept);
    await expect(service.getContractByUserID(ID, statusID)).rejects.toThrow(errorStringToExcept);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(0);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(0);
  });

  it('Find existing contracts by user ID returns valid contract information', async () => {

    let storedContract1: ContractEntity = {ID: 1, title: 'Contract title', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let storedContract2: ContractEntity = {ID: 2, title: 'Contract title', description: 'Some company', status: {ID: 3, status: 'Accepted'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let userID: number = 1;
    let statusID: number = 0;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve([storedContract1, storedContract2]);});});

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    let foundContract: Contract[];

    await expect(foundContract = await service.getContractByUserID(userID, statusID)).resolves;
    expect(foundContract).toStrictEqual([storedContract1, storedContract2]);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledWith(foundContract);
    expect(mockContractRepository.createQueryBuilder().andWhere).toHaveBeenCalledTimes(2);
  });

  it('Find existing contracts by user ID and status ID returns valid contract information', async () => {

    let storedContract1: ContractEntity = {ID: 1, title: 'Contract title', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let storedContract2: ContractEntity = {ID: 2, title: 'Contract title', description: 'Some company', status: {ID: 3, status: 'Accepted'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let userID: number = 1;
    let statusID: number = 2;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve([storedContract1, storedContract2]);});});

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    let foundContract: Contract[];

    await expect(foundContract = await service.getContractByUserID(userID, statusID)).resolves;
    expect(foundContract).toStrictEqual([storedContract1, storedContract2]);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledWith(foundContract);
    expect(mockContractRepository.createQueryBuilder().andWhere).toHaveBeenCalledTimes(3);
    expect(mockContractRepository.createQueryBuilder().andWhere).toHaveBeenCalledWith(`status.ID = :statusID`, { statusID: `${statusID}` });
  });

  //#endregion

  //#region GetContractsByResume

  it('Find contract with invalid resumeID results in error', async () => {

    let ID: number = 0;
    let errorStringToExcept = 'Resume ID must be instantiated or valid';

    await expect(service.getContractsByResume(null)).rejects.toThrow(errorStringToExcept);
    await expect(service.getContractsByResume(ID)).rejects.toThrow(errorStringToExcept);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(0);
  });

  it('Find existing contracts by resume ID returns valid contract information', async () => {

    let storedContract1: ContractEntity = {ID: 1, title: 'Contract title', description: 'Some company', status: {ID: 1, status: 'Pending review'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let storedContract2: ContractEntity = {ID: 2, title: 'Contract title', description: 'Some company', status: {ID: 3, status: 'Accepted'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let resumeID: number = 1;

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve([storedContract1, storedContract2]);});});

    let foundContract: Contract[];

    await expect(foundContract = await service.getContractsByResume(resumeID)).resolves;
    expect(foundContract).toStrictEqual([storedContract1, storedContract2]);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(2);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Pending review');
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Accepted');
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
      jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

      await expect(service.getContracts(theory.filter)).rejects.toThrow(theory.expectedError);
      expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(0);
      expect(mockContractRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(0);
      expect(service.verifyContractStatuses).toHaveBeenCalledTimes(0);
    });
  });

  it('Get contracts returns valid filterList', async () => {

    let storedContracts: ContractEntity[] = [
      {ID: 1, title: 'Mærsk Contract', description: 'Some company', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-16-08T21:00:00'), status: {ID: 1, status: 'Draft'}, resumes: [], users: [], resumeRequests: []},
      {ID: 2, title: 'O&J Brand og Sikring', description: 'Some company', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-16-08T21:00:00'), status: {ID: 2, status: 'Pending review'}, resumes: [], users: [], resumeRequests: []},
      {ID: 3, title: 'Slik for voksne', description: 'Some company', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-16-08T21:00:00'), status: {ID: 1, status: 'Draft'}, resumes: [], users: [], resumeRequests: []},
    ]

    let expectedTotalListSize: number = 3;
    let expectedListSize: number = 3;

    let expectedList: ContractEntity[] = [storedContracts[0], storedContracts[1], storedContracts[2]]

    let filter: Filter = {currentPage: 1, itemsPrPage: 2};

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getMany')
      .mockImplementation(() => {return new Promise(resolve => {resolve(storedContracts);});});

    jest
      .spyOn(mockContractRepository.createQueryBuilder(), 'getCount')
      .mockImplementation(() => {return new Promise(resolve => {resolve(storedContracts.length);});});

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    let filterList: FilterList<Contract>;
    await expect(filterList = await service.getContracts(filter)).resolves;
    expect(filterList.list).toStrictEqual(expectedList);
    expect(filterList.list.length).toBe(expectedListSize)
    expect(filterList.totalItems).toBe(expectedTotalListSize);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledWith(filterList.list);
  });

  it('Get contracts returns valid filterList when offset', async () => {

    let storedContracts: ContractEntity[] = [
      {ID: 1, title: 'Mærsk Contract', description: 'Some company', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-16-08T21:00:00'), status: {ID: 1, status: 'Draft'}, resumes: [], users: [], resumeRequests: []},
      {ID: 2, title: 'O&J Brand og Sikring', description: 'Some company', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-16-08T21:00:00'), status: {ID: 2, status: 'Pending review'}, resumes: [], users: [], resumeRequests: []},
      {ID: 3, title: 'Slik for voksne', description: 'Some company', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-16-08T21:00:00'), status: {ID: 1, status: 'Draft'}, resumes: [], users: [], resumeRequests: []},
    ]

    let expectedTotalListSize: number = 3;
    let expectedListSize: number = 1;

    let expectedList: Contract[] = [storedContracts[2]]

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

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    let filterList: FilterList<Contract>;
    await expect(filterList = await service.getContracts(filter)).resolves;
    expect(filterList.list).toStrictEqual(expectedList);
    expect(filterList.list.length).toBe(expectedListSize)
    expect(filterList.totalItems).toBe(expectedTotalListSize);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledWith(filterList.list);
  });

  it('Get contracts returns valid filterList when limit', async () => {

    let storedContracts: ContractEntity[] = [
      {ID: 1, title: 'Mærsk Contract', description: 'Some company', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-16-08T21:00:00'), status: {ID: 1, status: 'Draft'}, resumes: [], users: [], resumeRequests: []},
      {ID: 2, title: 'O&J Brand og Sikring', description: 'Some company', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-16-08T21:00:00'), status: {ID: 2, status: 'Pending review'}, resumes: [], users: [], resumeRequests: []},
      {ID: 3, title: 'Slik for voksne', description: 'Some company', startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-16-08T21:00:00'), status: {ID: 1, status: 'Draft'}, resumes: [], users: [], resumeRequests: []},
    ]

    let expectedTotalListSize: number = 3;
    let expectedListSize: number = 2;

    let expectedList: ContractEntity[] = [storedContracts[0], storedContracts[1]]

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

    jest.spyOn(service, 'verifyContractStatuses').mockImplementation();

    let filterList: FilterList<Contract>;
    await expect(filterList = await service.getContracts(filter)).resolves;
    expect(filterList.list).toStrictEqual(expectedList);
    expect(filterList.list.length).toBe(expectedListSize)
    expect(filterList.totalItems).toBe(expectedTotalListSize);
    expect(mockContractRepository.createQueryBuilder().getMany).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledTimes(1);
    expect(service.verifyContractStatuses).toHaveBeenCalledWith(filterList.list);
  });

  //#endregion

  //#region ConfirmContract

  it('Confirming contract with status not equal to pending review throws error', async () => {

    let contract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 2, status: 'Pending review'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};
    let storedContract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};

    let isAccepted: boolean = true;

    jest.spyOn(service, 'getContractByID').mockImplementation((ID: number) => {return new Promise(resolve => {resolve(storedContract);});});
    jest.spyOn(service, 'update').mockImplementation();

    let expectedErrorMessage: string = 'Contract is not pending review and cannot be accepted or declined';

    await expect(service.confirmContract(contract, isAccepted)).rejects.toThrow(expectedErrorMessage);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contract.ID);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(0);
    expect(service.update).toHaveBeenCalledTimes(0);
  });

  it('Confirming contract with invalid date throws error', async () => {

    let storedDate: Date = new Date('2021-11-08T21:00:00');

    let contract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 2, status: 'Pending review'}, startDate: new Date(), endDate: new Date(), dueDate: storedDate, resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};
    let storedContract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 2, status: 'Pending review'}, startDate: new Date(), endDate: new Date(), dueDate: storedDate, resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};

    let isAccepted: boolean = true;

    jest.spyOn(service, 'getContractByID').mockImplementation((ID: number) => {return new Promise(resolve => {resolve(storedContract);});});
    jest.spyOn(service, 'update').mockImplementation();

    let expectedErrorMessage: string = 'The validation window for this contract is expired and cannot be accepted or declined';

    await expect(service.confirmContract(contract, isAccepted)).rejects.toThrow(expectedErrorMessage);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contract.ID);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(0);
    expect(service.update).toHaveBeenCalledTimes(0);
  });

  it('Updating contract with isAccepted status calls find status by name of type accepted', async () => {

    let storedDate: Date = new Date();
    storedDate.setDate(storedDate.getDate() + 1);

    let contract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 2, status: 'Pending review'}, startDate: new Date(), endDate: new Date(), dueDate: storedDate, resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};
    let storedContract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 2, status: 'Pending review'}, startDate: new Date(), endDate: new Date(), dueDate: storedDate, resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};

    let storedStatus: Status = {ID: 3, status: 'Accepted'}
    let isAccepted: boolean = true;

    jest.spyOn(service, 'update').mockImplementationOnce((contract) => {return new Promise(resolve => {resolve(contract);});});
    jest.spyOn(mockStatusService, 'findStatusByName').mockImplementationOnce((status) => {return new Promise(resolve => {resolve(storedStatus);});});
    jest.spyOn(service, 'getContractByID').mockImplementation((ID: number) => {return new Promise(resolve => {resolve(storedContract);});});

    let updatedContract: Contract;

    await expect(updatedContract = await service.confirmContract(contract, isAccepted)).resolves;
    expect(updatedContract).toBeDefined();
    expect(updatedContract.status).toBe(storedStatus);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contract.ID);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Accepted');
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(contract);
  });

  it('Updating contract with isAccepted status of false calls find status by name of type Declined', async () => {

    let storedDate: Date = new Date();
    storedDate.setDate(storedDate.getDate() + 1);

    let contract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 2, status: 'Pending review'}, startDate: new Date(), endDate: new Date(), dueDate: storedDate, resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};
    let storedContract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 2, status: 'Pending review'}, startDate: new Date(), endDate: new Date(), dueDate: storedDate, resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};

    let storedStatus: Status = {ID: 3, status: 'Rejected'}
    let isAccepted: boolean = false;

    jest.spyOn(service, 'update').mockImplementationOnce((contract) => {return new Promise(resolve => {resolve(contract);});});
    jest.spyOn(mockStatusService, 'findStatusByName').mockImplementationOnce((status) => {return new Promise(resolve => {resolve(storedStatus);});});
    jest.spyOn(service, 'getContractByID').mockImplementation((ID: number) => {return new Promise(resolve => {resolve(storedContract);});});

    let updatedContract: Contract;

    await expect(updatedContract = await service.confirmContract(contract, isAccepted)).resolves;
    expect(updatedContract).toBeDefined();
    expect(updatedContract.status).toBe(storedStatus);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contract.ID);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Rejected');
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(contract);
  });

  //#endregion

  //#region RequestRenewal

  it('Requesting renewal for contract with different status throws error', async () => {

    let contract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 2, status: 'Expired'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};
    let storedContract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 2, status: 'Pending review'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};

    jest.spyOn(service, 'getContractByID').mockImplementation((ID: number) => {return new Promise(resolve => {resolve(storedContract);});});
    jest.spyOn(service, 'update').mockImplementation();

    let expectedErrorMessage: string = 'Contract is not expired and cannot be requested for renewal';

    await expect(service.requestRenewal(contract)).rejects.toThrow(expectedErrorMessage);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contract.ID);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(0);
    expect(service.update).toHaveBeenCalledTimes(0);

  });

  it('Requesting renewal for contract with correct status is successful', async () => {

    let contract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 2, status: 'Expired'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};
    let storedContract: Contract = {ID: 1, title: 'Contract', description: 'Some company', status: {ID: 2, status: 'Expired'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};

    jest.spyOn(service, 'getContractByID').mockImplementation((ID: number) => {return new Promise(resolve => {resolve(storedContract);});});
    jest.spyOn(service, 'update').mockImplementation((contract: Contract) => {return new Promise(resolve => {resolve(contract);});});

    let result: Contract;

    await expect(result = await service.requestRenewal(contract)).resolves;
    expect(result).toBe(contract);
    expect(result.status.status).toEqual('Draft');

    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contract.ID);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Draft');
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith(contract);
  });

  //#endregion

  //#region Update

  it('Update contract with invalid ID throws error', async () => {

    let contract: Contract = {ID: 0, title: 'Contract title', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let expectedErrorMessage: string = 'Contract ID must be instantiated or valid'

    jest
      .spyOn(service, 'getContractByID')
      .mockImplementationOnce((ID: number) => {throw new Error('Contract ID must be instantiated or valid');});

    jest.spyOn(service, 'verifyContractEntity').mockImplementationOnce(() => {});

    const mockedManager = {
      save: jest.fn(() => {}),
      createQueryBuilder: jest.fn(() => {return createQueryBuilder})
    }

    const createQueryBuilder: any = {
      from: () => createQueryBuilder,
      delete: jest.fn(() => {return deleteQueryBuilder}),
    };

    const deleteQueryBuilder: any = {
      where: () => deleteQueryBuilder,
      execute: jest.fn(() => {}),
    };

    connection.transaction = jest.fn().mockImplementation((fn) => {return fn(mockedManager)});

    await expect(service.update(contract)).rejects.toThrow(expectedErrorMessage);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contract.ID);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(0);
    expect(mockResumeRequestRepository.create).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(0);
    expect(mockedManager.save).toHaveBeenCalledTimes(0);
    expect(deleteQueryBuilder.execute).toHaveBeenCalledTimes(0);
  });

  it('Update contract with invalid data throws error', async () => {

    let storedContract: Contract = {ID: 1, title: 'Contract title', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};
    let contractToUpdate: Contract = {ID: 1, title: '', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};

    jest
      .spyOn(service, 'getContractByID')
      .mockImplementationOnce((ID: number) => {return new Promise(resolve => {return resolve(storedContract);});});

    jest
      .spyOn(service, 'verifyContractEntity')
      .mockImplementationOnce((contract: Contract) => {throw new Error('Contract must have a valid title')});

    const mockedManager = {
      save: jest.fn(() => {}),
      createQueryBuilder: jest.fn(() => {return createQueryBuilder})
    }

    const createQueryBuilder: any = {
      from: () => createQueryBuilder,
      delete: jest.fn(() => {return deleteQueryBuilder}),
    };

    const deleteQueryBuilder: any = {
      where: () => deleteQueryBuilder,
      execute: jest.fn(() => {}),
    };

    connection.transaction = jest.fn().mockImplementation((fn) => {return fn(mockedManager)});

    let expectedErrorMessage: string = 'Contract must have a valid title'

    await expect(service.update(contractToUpdate)).rejects.toThrow(expectedErrorMessage);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contractToUpdate.ID);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contractToUpdate);
    expect(mockResumeRequestRepository.create).toHaveBeenCalledTimes(0);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(0);
    expect(mockedManager.save).toHaveBeenCalledTimes(0);
    expect(deleteQueryBuilder.execute).toHaveBeenCalledTimes(0);
  });

  it('Error while updating contract throws error', async () => {

    let storedContract: Contract = {ID: 1, title: 'Contract title', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};
    let contractToUpdate: Contract = {ID: 1, title: 'New contract title', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: []};

    jest
      .spyOn(service, 'getContractByID')
      .mockImplementationOnce((ID: number) => {return new Promise(resolve => {return resolve(storedContract);});});

    jest
      .spyOn(service, 'verifyContractEntity')
      .mockImplementationOnce((contract: Contract) => {});

    const mockedManager = {
      save: jest.fn(() => {throw new Error('')}),
      createQueryBuilder: jest.fn(() => {return createQueryBuilder})
    }

    const createQueryBuilder: any = {
      from: () => createQueryBuilder,
      delete: jest.fn(() => {return deleteQueryBuilder}),
    };

    const deleteQueryBuilder: any = {
      where: () => deleteQueryBuilder,
      execute: jest.fn(() => {}),
    };

    connection.transaction = jest.fn().mockImplementation((fn) => {return fn(mockedManager)});

    let expectedErrorMessage: string = 'Internal server error'

    await expect(service.update(contractToUpdate)).rejects.toThrow(expectedErrorMessage);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contractToUpdate.ID);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contractToUpdate);
    expect(deleteQueryBuilder.execute).toHaveBeenCalledTimes(1);
    expect(mockResumeRequestRepository.create).toHaveBeenCalledTimes(1);
    expect(mockResumeRequestRepository.create).toHaveBeenCalledWith(contractToUpdate.resumeRequests);
    expect(mockedManager.save).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(0);
  });

  it('Updating contract with valid data resolves correctly', async () => {

    let storedContract: Contract = {ID: 1, title: 'Contract title', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};
    let contractToUpdate: Contract = {ID: 1, title: 'New contract title', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};

    jest
      .spyOn(service, 'getContractByID')
      .mockImplementationOnce((ID: number) => {return new Promise(resolve => {return resolve(storedContract);});});

    jest
      .spyOn(service, 'verifyContractEntity')
      .mockImplementationOnce((contract: Contract) => {});

    const mockedManager = {
      save: jest.fn(() => {return new Promise(resolve => {resolve(contractToUpdate)});}),
      createQueryBuilder: jest.fn(() => {return createQueryBuilder})
    }

    const createQueryBuilder: any = {
      from: () => createQueryBuilder,
      delete: jest.fn(() => {return deleteQueryBuilder}),
    };

    const deleteQueryBuilder: any = {
      where: () => deleteQueryBuilder,
      execute: jest.fn(() => {}),
    };

    connection.transaction = jest.fn().mockImplementation((fn) => {return fn(mockedManager)});

    let updatedContract: Contract;

    await expect(updatedContract = await service.update(contractToUpdate)).resolves;
    expect(updatedContract).toStrictEqual(contractToUpdate);
    expect(service.getContractByID).toHaveBeenCalledTimes(1);
    expect(service.getContractByID).toHaveBeenCalledWith(contractToUpdate.ID);
    expect(service.verifyContractEntity).toHaveBeenCalledTimes(1);
    expect(service.verifyContractEntity).toHaveBeenCalledWith(contractToUpdate);
    expect(deleteQueryBuilder.execute).toHaveBeenCalledTimes(1);
    expect(mockResumeRequestRepository.create).toHaveBeenCalledTimes(1);
    expect(mockResumeRequestRepository.create).toHaveBeenCalledWith([]);
    expect(mockedManager.save).toHaveBeenCalledTimes(2);
    expect(mockContractRepository.create).toHaveBeenCalledTimes(1);
    expect(mockContractRepository.create).toHaveBeenCalledWith(contractToUpdate);
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

      { input: contract = {ID: null, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Contract must have a valid ID" },
      { input: contract = {ID: -1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Contract must have a valid ID" },
      { input: contract = {ID: 0, title: null, description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Contract must have a valid title" },
      { input: contract = {ID: 0, title: '', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Contract must have a valid title" },
      { input: contract = {ID: 0, title: ' ', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Contract must have a valid title" },
      { input: contract = {ID: 0, title: 'Mærsk Offshore', description: null, status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Contract must have a valid description under 500 characters" },
      { input: contract = {ID: 0, title: 'Mærsk Offshore', description: 'SomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTex' +
            'tSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSom' +
            'eTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeTextSomeT', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Contract must have a valid description under 500 characters" },
      { input: contract = {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: null, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Contract must have a valid status" },
      { input: contract = {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 0, status: ''}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Contract must have a valid status" },
      { input: contract = {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: -5, status: ' '}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Contract must have a valid status" },
      { input: contract = {ID: 0, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: null, endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Contract must contain a valid start date" },
      { input: contract = {ID: 0, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: null, users: [], resumes: [], resumeRequests: []},
        expected: "Contract must contain a valid end date" },
      { input: contract = {ID: 0, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-11-08T20:00:00'), users: [], resumes: [], resumeRequests: []},
        expected: "Start date cannot be after end date" },
    ];

    theoretically('The right error message is thrown to the fitting error', theories, theory => {
      expect(() => { service.verifyContractEntity(theory.input as Contract); }).toThrow(theory.expected);
    })
  });

  describe('Validation of valid contract does not throw errors', () => {
    let contract: Contract;
    const theories = [
      { input: contract = {ID: 0, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []}},
      { input: contract = {ID: 1, title: ' Mærsk Offshore ', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', description: '', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', description: ' ', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', description: '  Some Company  ', status: {ID: 1, status: 'Draft'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 2, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 2, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [], resumes: [], resumeRequests: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 2, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [{ID: 1, username: 'User@gmail.com', salt: 'saltValue', password: 'passwordValue', status: {ID: 1, status: 'Pending'}, role: {ID: 1, role: 'User'}}], resumes: [], resumeRequests: []}},
      { input: contract = {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 2, status: 'Accepted '}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), users: [{ID: 1, username: 'User@gmail.com', salt: 'saltValue', password: 'passwordValue', status: {ID: 1, status: 'Pending'}, role: {ID: 1, role: 'User'}}], resumes: [{ID: 1}], resumeRequests: []}},
    ];

    theoretically('No error message is thrown using contract validation', theories, theory => {
      expect(service.verifyContractEntity(theory.input)).resolves;
    })
  });

  //#endregion

  //#region VerifyContractStatuses

  describe('Update is executed for outdated contracts with status of pending review', () => {
    let contracts: Contract[];

    function addDays(date: Date, days: number){
      date.setDate(date.getDate() + days);
      return date;
    }

    const theories = [
      { input: contracts = [
        {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 3, status: 'Pending review'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), dueDate: addDays(new Date(), 1), users: [], resumes: [], resumeRequests: []},
        {ID: 2, title: 'Semco Maritime', description: 'Some company', status: {ID: 3, status: 'Pending review'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), dueDate: addDays(new Date(), -1), users: [], resumes: [], resumeRequests: []},
        {ID: 3, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 3, status: 'Pending review'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), dueDate: addDays(new Date(), 0), users: [], resumes: [], resumeRequests: []},
        ],
        expectedCalls: 2
      },
      { input: contracts = [
          {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 5, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), dueDate: addDays(new Date(), 1), users: [], resumes: [], resumeRequests: []},
          {ID: 2, title: 'Semco Maritime', description: 'Some company', status: {ID: 6, status: 'Rejected'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), dueDate: addDays(new Date(), -1), users: [], resumes: [], resumeRequests: []},
          {ID: 3, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 3, status: 'Pending review'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), dueDate: addDays(new Date(), 0), users: [], resumes: [], resumeRequests: []},
        ],
        expectedCalls: 1
      },
      { input: contracts = [
          {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 3, status: 'Pending review'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), dueDate: addDays(new Date(), 1), users: [], resumes: [], resumeRequests: []},
          {ID: 2, title: 'Semco Maritime', description: 'Some company', status: {ID: 3, status: 'Pending review'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), dueDate: addDays(new Date(), 2), users: [], resumes: [], resumeRequests: []},
          {ID: 3, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 3, status: 'Pending review'}, startDate: new Date('2021-11-08T21:00:00'), endDate: new Date('2021-12-15T21:00:00'), dueDate: addDays(new Date(), 3), users: [], resumes: [], resumeRequests: []},
        ],
        expectedCalls: 0
      },

    ];

    theoretically('Correct calls are performed', theories, async theory => {

      let result: Contract[];

      await expect(result = await service.verifyContractStatuses(theory.input)).resolves;
      expect(result).toBeDefined();
      expect(result).toBe(theory.input);
      expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(2);
      expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Expired');
      expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Completed');
      expect(mockContractRepository.createQueryBuilder().update).toHaveBeenCalledTimes(theory.expectedCalls);
    })
  });

  describe('Update is executed for outdated contracts with status of accepted', () => {
    let contracts: Contract[];

    function addDays(date: Date, days: number){
      date.setDate(date.getDate() + days);
      return date;
    }

    const theories = [
      { input: contracts = [
          {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 5, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: addDays(new Date(), 1), dueDate: null, users: [], resumes: [], resumeRequests: []},
          {ID: 2, title: 'Semco Maritime', description: 'Some company', status: {ID: 5, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: addDays(new Date(), -1), dueDate: null, users: [], resumes: [], resumeRequests: []},
          {ID: 3, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 5, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: addDays(new Date(), 0), dueDate: null, users: [], resumes: [], resumeRequests: []},
        ],
        expectedCalls: 2
      },
      { input: contracts = [
          {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 3, status: 'Pending review'}, startDate: new Date('2021-11-08T21:00:00'), endDate: addDays(new Date(), 1), dueDate: null, users: [], resumes: [], resumeRequests: []},
          {ID: 2, title: 'Semco Maritime', description: 'Some company', status: {ID: 6, status: 'Rejected'}, startDate: new Date('2021-11-08T21:00:00'), endDate: addDays(new Date(), -1), dueDate: null, users: [], resumes: [], resumeRequests: []},
          {ID: 3, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 5, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: addDays(new Date(), 0), dueDate: null, users: [], resumes: [], resumeRequests: []},
        ],
        expectedCalls: 1
      },
      { input: contracts = [
          {ID: 1, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 5, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: addDays(new Date(), 1), dueDate: null, users: [], resumes: [], resumeRequests: []},
          {ID: 2, title: 'Semco Maritime', description: 'Some company', status: {ID: 5, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: addDays(new Date(), 2), dueDate: null, users: [], resumes: [], resumeRequests: []},
          {ID: 3, title: 'Mærsk Offshore', description: 'Some company', status: {ID: 5, status: 'Accepted'}, startDate: new Date('2021-11-08T21:00:00'), endDate: addDays(new Date(), 3), dueDate: null, users: [], resumes: [], resumeRequests: []},
        ],
        expectedCalls: 0
      },

    ];

    theoretically('Correct calls are performed', theories, async theory => {

      let result: Contract[];

      await expect(result = await service.verifyContractStatuses(theory.input)).resolves;
      expect(result).toBeDefined();
      expect(result).toBe(theory.input);
      expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(2);
      expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Expired');
      expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Completed');
      expect(mockContractRepository.createQueryBuilder().update).toHaveBeenCalledTimes(theory.expectedCalls);
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
