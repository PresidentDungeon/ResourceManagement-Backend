import { Test, TestingModule } from '@nestjs/testing';
import { ResumeService } from './resume.service';
import { FindManyOptions, Repository } from "typeorm";
import { ResumeEntity } from "../../infrastructure/data-source/postgres/entities/resume.entity";
import { ContractStatusService } from "./contract-status.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { IContractStatusServiceProvider } from "../primary-ports/contract-status.service.interface";
import { ContractStatusEntity } from "../../infrastructure/data-source/postgres/entities/contract-status.entity";
import { Contract } from "../models/contract";
import theoretically from "jest-theories";
import { Resume } from "../models/resume";
import { AxiosResponse } from "axios";
import { Observable, of, throwError } from "rxjs";
import { FilterList } from "../models/filterList";

describe('ResumeService', () => {

  let service: ResumeService;
  let mockResumeRepository: Repository<ResumeEntity>;
  let mockStatusService: ContractStatusService;
  let mockHTTPService: HttpService;
  let mockConfigService: ConfigService;

  beforeEach(async () => {

    const MockResumeRepository = {
      provide: getRepositoryToken(ResumeEntity),
      useFactory: () => ({
        count: jest.fn((options: FindManyOptions<ResumeEntity>) => {}),
        save: jest.fn((contractorEntity: ResumeEntity) => { return new Promise(resolve => {resolve(contractorEntity);});}),
        create: jest.fn((contractorEntity: ResumeEntity) => {return new Promise(resolve => {resolve(contractorEntity);});}),
        execute: jest.fn(() => {}),
        createQueryBuilder: jest.fn(() => {return createQueryBuilder}),
      })
    };

    const MockHTTPService = {
      provide: HttpService,
      useFactory: () => ({
        get: jest.fn(() => {let axiosReponse: AxiosResponse<Resume> = {data: {ID: 1}, statusText: 'success', status: 1, config: null, request: null, headers: null}; return of(axiosReponse);}),
      })
    };

    const MockConfigService = {
      provide: ConfigService,
      useFactory: () => ({
        get: jest.fn((keyValue: string) => {return 'http://localhost:3150'}),
      })
    };

    const createQueryBuilder: any = {
      leftJoinAndSelect: () => createQueryBuilder,
      leftJoin: () => createQueryBuilder,
      andWhere: () => createQueryBuilder,
      select: () => createQueryBuilder,
      addSelect: () => createQueryBuilder,
      groupBy: () => createQueryBuilder,
      getOne: jest.fn(() => {}),
      getRawOne: jest.fn(() => {}),
      getMany: jest.fn(() => {}),
      getRawMany: jest.fn(() => {}),
      getCount: jest.fn(() => {}),
      offset: jest.fn(() => {}),
      limit: jest.fn(() => {}),
    };

    const StatusServiceMock = {
      provide: IContractStatusServiceProvider,
      useFactory: () => ({
        findStatusByName: jest.fn((name: string) => {let statusEntity: ContractStatusEntity = {ID: 1, status: name}; return statusEntity;}),
        getStatuses: jest.fn(() => {let statusEntities: ContractStatusEntity[] = [{ID: 1, status: 'Draft'}, {ID: 2, status: 'Pending review'}]; return new Promise(resolve => {resolve(statusEntities);});}),
      })
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [ResumeService, StatusServiceMock, MockResumeRepository, MockHTTPService, MockConfigService],
    }).compile();

    service = module.get<ResumeService>(ResumeService);
    mockResumeRepository = module.get<Repository<ResumeEntity>>(getRepositoryToken(ResumeEntity));
    mockStatusService = module.get<ContractStatusService>(IContractStatusServiceProvider);
    mockHTTPService = module.get<HttpService>(HttpService);
    mockConfigService = module.get<ConfigService>(ConfigService);
  });

  it('Resume service be defined', () => {
    expect(service).toBeDefined();
  });

  it('Resume repository be defined', () => {
    expect(mockResumeRepository).toBeDefined();
  });

  it('Resume status service be defined', () => {
    expect(mockStatusService).toBeDefined();
  });

  it('HTTP service be defined', () => {
    expect(mockHTTPService).toBeDefined();
  });

  it('Config service be defined', () => {
    expect(mockConfigService).toBeDefined();
  });

  //#region GetResumeByID

  it('Get resume by ID throws error if resume is invalid', async () => {

    let invalidID: number = 1;

    jest.spyOn(mockHTTPService, 'get').mockImplementation((url: string) => {return throwError('');});
    jest.spyOn(service, 'redactResume').mockImplementation();

    let expectedErrorMessage = 'No resume found with such an ID';

    await expect(service.getResumeByID(invalidID, false)).rejects.toThrow(expectedErrorMessage);
    expect(mockConfigService.get).toHaveBeenCalledTimes(1);
    expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_API_URL');
    expect(mockHTTPService.get).toHaveBeenCalledTimes(1);
    expect(mockHTTPService.get).toHaveBeenCalledWith(mockConfigService.get('MOCK_API_URL') + `/resume/getResumeByID?ID=${invalidID}`);
    expect(service.redactResume).toHaveBeenCalledTimes(0);
  });

  it('Get resume by ID returns non-redacted resume and calls correct API', async () => {

    let resumeID: number = 1;
    let resume: Resume;

    jest.spyOn(service, 'redactResume').mockImplementation();

    await expect(resume = await service.getResumeByID(resumeID, false)).resolves;
    expect(resume).toBeDefined();
    expect(mockConfigService.get).toHaveBeenCalledTimes(1);
    expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_API_URL');
    expect(mockHTTPService.get).toHaveBeenCalledTimes(1);
    expect(mockHTTPService.get).toHaveBeenCalledWith(mockConfigService.get('MOCK_API_URL') + `/resume/getResumeByID?ID=${resumeID}`);
    expect(service.redactResume).toHaveBeenCalledTimes(0);
  });

  it('Get resume by ID returns redacted resume and calls correct API', async () => {

    let resumeID: number = 1;
    let resume: Resume;

    jest.spyOn(service, 'redactResume').mockImplementation((resume: Resume) => {return resume;});

    await expect(resume = await service.getResumeByID(resumeID, true)).resolves;
    expect(resume).toBeDefined();
    expect(mockConfigService.get).toHaveBeenCalledTimes(1);
    expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_API_URL');
    expect(mockHTTPService.get).toHaveBeenCalledTimes(1);
    expect(mockHTTPService.get).toHaveBeenCalledWith(mockConfigService.get('MOCK_API_URL') + `/resume/getResumeByID?ID=${resumeID}`);
    expect(service.redactResume).toHaveBeenCalledTimes(1);
  });

  //#endregion

  //#region GetResumesByID

  it('Get resumes by ID calls resume service with correct IDs', async () => {

    let simpleResumes: Resume[] = [{ID: 1}, {ID: 5}, {ID: 11}];

    jest.spyOn(service, 'getResumeByID').mockImplementation((resumeID: number) => {return new Promise(resolve => {resolve({ID: resumeID});});});

    let resumes: Resume[];

    await expect(resumes = await service.getResumesByID(simpleResumes, true)).resolves;
    expect(resumes).toStrictEqual(simpleResumes);
    expect(service.getResumeByID).toHaveBeenCalledTimes(3);
    expect(service.getResumeByID).toHaveBeenCalledWith(simpleResumes[0].ID, true);
    expect(service.getResumeByID).toHaveBeenCalledWith(simpleResumes[1].ID, true);
    expect(service.getResumeByID).toHaveBeenCalledWith(simpleResumes[2].ID, true);
  });

  describe('Get resumes by ID sorts resumes correctly', () => {

    let resumes: Resume[];
    let expectedOrder: Resume[];
    let returnedResumes: Resume[];

    const theories = [
      { simpleRecipe: resumes = [{ID: 5}, {ID: 1}, {ID: 10}], sortedRecipes: expectedOrder = [{ID: 1}, {ID: 5}, {ID: 10}] },
      { simpleRecipe: resumes = [{ID: 11}, {ID: 0}, {ID: -1}], sortedRecipes: expectedOrder = [{ID: -1}, {ID: 0}, {ID: 11}] },
      { simpleRecipe: resumes = [{ID: 1}, {ID: 2}, {ID: 3}], sortedRecipes: expectedOrder = [{ID: 1}, {ID: 2}, {ID: 3}] },
    ];

    theoretically('Recipes are sorted after ID', theories, async theory => {

      jest.spyOn(service, 'getResumeByID').mockImplementation((resumeID: number) => {return new Promise(resolve => {resolve({ID: resumeID});});});
      await expect(returnedResumes = await service.getResumesByID(theory.simpleRecipe, true)).resolves;
      expect(theory.sortedRecipes).toEqual(returnedResumes);
    })
  });

  it('Get resumes by ID doesnt return missing IDs', async () => {

    let simpleResumes: Resume[] = [{ID: 1}, {ID: 5}, {ID: 11}];
    let expectedResumes: Resume[] = [{ID: 1}, {ID: 11}];

    jest.spyOn(service, 'getResumeByID').mockImplementationOnce((resumeID: number) => {return new Promise(resolve => {resolve({ID: resumeID});});});
    jest.spyOn(service, 'getResumeByID').mockImplementationOnce((resumeID: number) => {return new Promise(resolve => {throw new Error()});});
    jest.spyOn(service, 'getResumeByID').mockImplementationOnce((resumeID: number) => {return new Promise(resolve => {resolve({ID: resumeID});});});

    let resumes: Resume[];

    await expect(resumes = await service.getResumesByID(simpleResumes, true)).resolves;
    expect(resumes).toStrictEqual(expectedResumes);
    expect(service.getResumeByID).toHaveBeenCalledTimes(3);
    expect(service.getResumeByID).toHaveBeenCalledWith(simpleResumes[0].ID, true);
    expect(service.getResumeByID).toHaveBeenCalledWith(simpleResumes[1].ID, true);
    expect(service.getResumeByID).toHaveBeenCalledWith(simpleResumes[2].ID, true);
  });

  //#endregion

  //#region GetResumes

  it('Get resumes calls mock API with filter', async () => {

    let filter: string = '?currentPage=0&itemsPrPage=25';
    let resumes: FilterList<Resume>;

    jest.spyOn(service, 'getResumesCount').mockImplementation();

    await expect(resumes = await service.getResumes(filter, false)).resolves;
    expect(resumes).toBeDefined();
    expect(mockConfigService.get).toHaveBeenCalledTimes(1);
    expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_API_URL');
    expect(mockHTTPService.get).toHaveBeenCalledTimes(1);
    expect(mockHTTPService.get).toHaveBeenCalledWith(mockConfigService.get('MOCK_API_URL') + `/resume/getResumes` + filter);
    expect(service.getResumesCount).toHaveBeenCalledTimes(0);
  });

  it('Get resumes calls get resumes count if get recipes count is true', async () => {

    let filter: string = '?currentPage=0&itemsPrPage=25';
    let excludeContract: number = 1;
    let resumes: FilterList<Resume>;

    jest.spyOn(service, 'getResumesCount').mockImplementation();

    await expect(resumes = await service.getResumes(filter, true, excludeContract)).resolves;
    expect(resumes).toBeDefined();
    expect(mockConfigService.get).toHaveBeenCalledTimes(1);
    expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_API_URL');
    expect(mockHTTPService.get).toHaveBeenCalledTimes(1);
    expect(mockHTTPService.get).toHaveBeenCalledWith(mockConfigService.get('MOCK_API_URL') + `/resume/getResumes` + filter);
    expect(service.getResumesCount).toHaveBeenCalledTimes(1);
    expect(service.getResumesCount).toHaveBeenCalledWith(resumes.list, excludeContract);
  });

  //#endregion

  //#region GetResumeCount

  it('Get resume count by ID fails on invalid ID', async () => {

    let ID: number = 0;
    let expectedErrorMessage: string = 'Resume ID must be instantiated or valid';

    await expect(service.getResumeCount(null)).rejects.toThrow(expectedErrorMessage);
    await expect(service.getResumeCount(ID)).rejects.toThrow(expectedErrorMessage);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(0);
    expect(mockResumeRepository.createQueryBuilder).toHaveBeenCalledTimes(0);
    expect(mockResumeRepository.createQueryBuilder().getCount).toHaveBeenCalledTimes(0);
  });

  describe('Get resume count amount', () => {

    let contract: Contract = {ID: 1, title: 'Contract one', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: []};
    let contract2: Contract = {ID: 2, title: 'Contract two', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 2}, {ID: 1}], users: []};
    let contract3: Contract = {ID: 3, title: 'Contract three', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 5}, {ID: 7}, {ID: 2}, {ID: 9}], users: []};
    let contract4: Contract = {ID: 4, title: 'Contract four', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}], users: []};

    let contracts: Contract[] = [contract, contract2, contract3, contract4];

    const theories = [
      { resumeID: 1, expectedAmount: 3 },
      { resumeID: 2, expectedAmount: 2 },
      { resumeID: 9, expectedAmount: 1 },
      { resumeID: 8, expectedAmount: 0 },
    ];

    theoretically('The right contract count is calculated', theories, async theory => {

      jest.spyOn(mockResumeRepository.createQueryBuilder(), 'getRawOne').mockImplementationOnce(() => {
        let count: number = 0;
        contracts.forEach((contract) => {contract.resumes.forEach((resume) => {if(resume.ID == theory.resumeID){count++;}})})
        return new Promise(resolve => {resolve({contracts: count})});
      });

      await expect(await service.getResumeCount(theory.resumeID)).toBe(theory.expectedAmount);
      expect(mockResumeRepository.createQueryBuilder().getRawOne).toHaveBeenCalledTimes(1);
      expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(2);
      expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Draft');
      expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Pending review');
    })
  });

  //#endregion

  //#region GetResumesCount

  it('Get resumes count returns empty array if empty array of resumes are inserted', async () => {

    let resumes: Resume[] = [];
    let expectedResult: Resume[] = [];
    let queryResults: any[] = [];

    jest.spyOn(mockResumeRepository.createQueryBuilder(), 'getRawMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(queryResults);});})

    let result: Resume[];

    await expect(result = await service.getResumesCount(resumes)).resolves;
    expect(result).toStrictEqual(expectedResult);
    expect(mockResumeRepository.createQueryBuilder().getRawMany).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(2);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Draft');
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Pending review');
  });

  it('Get resumes count maps correctly with existing resumes', async () => {

    let resumes: Resume[] = [{ID: 1}, {ID: 3}, {ID: 4}];
    let expectedResult: Resume[] = [{ID: 1, count: 2}, {ID: 3, count: 1}, {ID: 4, count: 1}];
    let queryResults: any[] = [{ID: 1, contracts: '2'}, {ID: 3, contracts: '1'}, {ID: 4, contracts: '1'}];

    jest.spyOn(mockResumeRepository.createQueryBuilder(), 'getRawMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(queryResults);});})

    let result: Resume[];

    await expect(result = await service.getResumesCount(resumes)).resolves;
    expect(result).toStrictEqual(expectedResult);
    expect(mockResumeRepository.createQueryBuilder().getRawMany).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(2);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Draft');
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Pending review');
  });

  it('Get resumes count maps correctly with invalid resumes', async () => {

    let resumes: Resume[] = [{ID: 1}, {ID: 3}, {ID: 4}];
    let expectedResult: Resume[] = [{ID: 1, count: 2}, {ID: 3, count: 0}, {ID: 4, count: 1}];
    let queryResults: any[] = [{ID: 1, contracts: '2'},  {ID: 4, contracts: '1'}];

    jest.spyOn(mockResumeRepository.createQueryBuilder(), 'getRawMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(queryResults);});})

    let result: Resume[];

    await expect(result = await service.getResumesCount(resumes)).resolves;
    expect(result).toStrictEqual(expectedResult);
    expect(mockResumeRepository.createQueryBuilder().getRawMany).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(2);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Draft');
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Pending review');
  });

  //#endregion

  //#region RedactResume

  describe('Resumes redact successfully', () => {

    let resume: Resume;
    let expectedResume: Resume;

    const theories = [
      { resume: resume = {ID: 1, firstName: 'Hans', middleName: 'Joachim', lastName: 'Madsen', middleLastName: 'Joachim Madsen'}},
      { resume: resume = {ID: 2, firstName: 'Lars', middleName: 'Elis', lastName: 'Hansen', middleLastName: 'Elis Hansen'}},
      { resume: resume = {ID: 3, firstName: 'Jacob', middleName: 'Geert', lastName: 'Olsen', middleLastName: 'Geert Olsen'}},
    ];

    theoretically('The resume is redacted', theories, theory => {

      let resumeResult: Resume = service.redactResume(theory.resume);
      expect(resumeResult).toBeDefined();
      expect(resumeResult.firstName).toBe('');
      expect(resumeResult.middleName).toBe('');
      expect(resumeResult.lastName).toBe('');
      expect(resumeResult.middleLastName).toBe('');
    })
  });

  //#endregion
  
});
