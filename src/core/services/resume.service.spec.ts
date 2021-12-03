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
import { GetResumesDTO } from "../../api/dtos/get.resumes.dto";

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
        post: jest.fn((url: string, IDs: number[]) => {let axiosReponse: AxiosResponse<Resume[]> = {data: IDs.map((ID: number) => {let resume: Resume = {ID: ID}; return resume}), statusText: 'success', status: 1, config: null, request: null, headers: null}; return of(axiosReponse);}),
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

  it('Get resumes by ID calls throws correct error on request fail', async () => {

    let simpleResumes: Resume[] = [{ID: 1}];

    jest.spyOn(mockHTTPService, 'post').mockImplementation((url: string) => {return throwError('');});
    jest.spyOn(service, 'redactResume').mockImplementation((resume: Resume) => {return resume});

    let expectedErrorMessage = 'Error loading resumes';

    await expect(service.getResumesByID(simpleResumes, true)).rejects.toThrow(expectedErrorMessage);
    expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_API_URL');
    expect(mockHTTPService.post).toHaveBeenCalledTimes(1);
    expect(mockHTTPService.post).toHaveBeenCalledWith(mockConfigService.get('MOCK_API_URL') + `/resume/getResumesByID`, [1]);
    expect(service.redactResume).toHaveBeenCalledTimes(0);
  });

  it('Get resumes by ID calls backend API  with correct IDs', async () => {

    let simpleResumes: Resume[] = [{ID: 1}, {ID: 5}, {ID: 11}];

    jest.spyOn(service, 'redactResume').mockImplementation((resume: Resume) => {return resume});
    let resumesReponse: Resume[];

    await expect(resumesReponse = await service.getResumesByID(simpleResumes, true)).resolves;
    expect(resumesReponse).toStrictEqual(simpleResumes);
    expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_API_URL');
    expect(mockHTTPService.post).toHaveBeenCalledTimes(1);
    expect(mockHTTPService.post).toHaveBeenCalledWith(mockConfigService.get('MOCK_API_URL') + `/resume/getResumesByID`, [1, 5, 11]);
    expect(service.redactResume).toHaveBeenCalledTimes(simpleResumes.length);
    expect(service.redactResume).toHaveBeenCalledWith(simpleResumes[0]);
    expect(service.redactResume).toHaveBeenCalledWith(simpleResumes[1]);
    expect(service.redactResume).toHaveBeenCalledWith(simpleResumes[2]);
  });

  it('Get resumes by ID doesnt call redact if set to false', async () => {

    let simpleResumes: Resume[] = [{ID: 1}, {ID: 5}, {ID: 11}];

    jest.spyOn(service, 'redactResume').mockImplementation((resume: Resume) => {return resume});
    let resumesReponse: Resume[];

    await expect(resumesReponse = await service.getResumesByID(simpleResumes, false)).resolves;
    expect(resumesReponse).toStrictEqual(simpleResumes);
    expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_API_URL');
    expect(mockHTTPService.post).toHaveBeenCalledTimes(1);
    expect(mockHTTPService.post).toHaveBeenCalledWith(mockConfigService.get('MOCK_API_URL') + `/resume/getResumesByID`, [1, 5, 11]);
    expect(service.redactResume).toHaveBeenCalledTimes(0);
  });

  //#endregion

  //#region GetResumes

  it('Get resumes throws correct error on request fail', async () => {

    let getResumeDTO: GetResumesDTO = {searchFilter: '?currentPage=0&itemsPrPage=25', shouldLoadResumeCount: false, excludeContract: 1};

    jest.spyOn(mockHTTPService, 'get').mockImplementation((url: string) => {return throwError('');});
    jest.spyOn(service, 'getResumesCount').mockImplementation();

    let expectedErrorMessage: string = 'Error loading resumes';

    await expect(service.getResumes(getResumeDTO)).rejects.toThrow(expectedErrorMessage);
    expect(mockConfigService.get).toHaveBeenCalledTimes(1);
    expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_API_URL');
    expect(mockHTTPService.get).toHaveBeenCalledTimes(1);
    expect(mockHTTPService.get).toHaveBeenCalledWith(mockConfigService.get('MOCK_API_URL') + `/resume/getResumes` + getResumeDTO.searchFilter);
    expect(service.getResumesCount).toHaveBeenCalledTimes(0);
  });

  it('Get resumes calls mock API with filter', async () => {

    let getResumeDTO: GetResumesDTO = {searchFilter: '?currentPage=0&itemsPrPage=25', shouldLoadResumeCount: false, excludeContract: 1};
    let resumes: FilterList<Resume>;

    jest.spyOn(service, 'getResumesCount').mockImplementation();

    await expect(resumes = await service.getResumes(getResumeDTO)).resolves;
    expect(resumes).toBeDefined();
    expect(mockConfigService.get).toHaveBeenCalledTimes(1);
    expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_API_URL');
    expect(mockHTTPService.get).toHaveBeenCalledTimes(1);
    expect(mockHTTPService.get).toHaveBeenCalledWith(mockConfigService.get('MOCK_API_URL') + `/resume/getResumes` + getResumeDTO.searchFilter);
    expect(service.getResumesCount).toHaveBeenCalledTimes(0);
  });

  it('Get resumes calls get resumes count if get recipes count is true', async () => {

    let getResumeDTO: GetResumesDTO = {searchFilter: '?currentPage=0&itemsPrPage=25', shouldLoadResumeCount: true, excludeContract: 1};
    let resumes: FilterList<Resume>;

    jest.spyOn(service, 'getResumesCount').mockImplementation();
    jest.spyOn(mockHTTPService, 'get').mockImplementation(() => {let axiosReponse: AxiosResponse<FilterList<Resume>> = {data: {list: [{ID: 1}], totalItems: 1}, statusText: 'success', status: 1, config: null, request: null, headers: null}; return of(axiosReponse);})

    await expect(resumes = await service.getResumes(getResumeDTO)).resolves;
    expect(resumes).toBeDefined();
    expect(mockConfigService.get).toHaveBeenCalledTimes(1);
    expect(mockConfigService.get).toHaveBeenCalledWith('MOCK_API_URL');
    expect(mockHTTPService.get).toHaveBeenCalledTimes(1);
    expect(mockHTTPService.get).toHaveBeenCalledWith(mockConfigService.get('MOCK_API_URL') + `/resume/getResumes` + getResumeDTO.searchFilter);
    expect(service.getResumesCount).toHaveBeenCalledTimes(1);
    expect(service.getResumesCount).toHaveBeenCalledWith(resumes.list, getResumeDTO);
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

    let contract: Contract = {ID: 1, title: 'Contract one', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}, {ID: 3}], users: [], resumeRequests: []};
    let contract2: Contract = {ID: 2, title: 'Contract two', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 2}, {ID: 1}], users: [], resumeRequests: []};
    let contract3: Contract = {ID: 3, title: 'Contract three', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 5}, {ID: 7}, {ID: 2}, {ID: 9}], users: [], resumeRequests: []};
    let contract4: Contract = {ID: 4, title: 'Contract four', description: 'Some company', status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [{ID: 1}], users: [], resumeRequests: []};

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
      expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Pending review');
      expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Accepted');
    })
  });

  //#endregion

  //#region GetResumesCount

  it('Get resumes count returns empty array if empty array of resumes are inserted', async () => {

    let resumes: Resume[] = [];
    let getResumeDTO: GetResumesDTO = {searchFilter: '?currentPage=0&itemsPrPage=25', shouldLoadResumeCount: true, excludeContract: 1};
    let expectedResult: Resume[] = [];
    let queryResults: any[] = [];

    jest.spyOn(mockResumeRepository.createQueryBuilder(), 'getRawMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(queryResults);});})

    let result: Resume[];

    await expect(result = await service.getResumesCount(resumes, getResumeDTO)).resolves;
    expect(result).toStrictEqual(expectedResult);
    expect(mockResumeRepository.createQueryBuilder().getRawMany).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(2);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Pending review');
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Accepted');
  });

  it('Get resumes count maps correctly with existing resumes', async () => {

    let resumes: Resume[] = [{ID: 1}, {ID: 3}, {ID: 4}];
    let expectedResult: Resume[] = [{ID: 1, count: 2}, {ID: 3, count: 1}, {ID: 4, count: 1}];
    let queryResults: any[] = [{ID: 1, contracts: '2'}, {ID: 3, contracts: '1'}, {ID: 4, contracts: '1'}];
    let getResumeDTO: GetResumesDTO = {searchFilter: '?currentPage=0&itemsPrPage=25', shouldLoadResumeCount: true};

    jest.spyOn(mockResumeRepository.createQueryBuilder(), 'getRawMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(queryResults);});})

    let result: Resume[];

    await expect(result = await service.getResumesCount(resumes, getResumeDTO)).resolves;
    expect(result).toStrictEqual(expectedResult);
    expect(mockResumeRepository.createQueryBuilder().getRawMany).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(2);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Pending review');
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Accepted');
  });

  it('Get resumes count maps correctly with invalid resumes', async () => {

    let resumes: Resume[] = [{ID: 1}, {ID: 3}, {ID: 4}];
    let expectedResult: Resume[] = [{ID: 1, count: 2}, {ID: 3, count: 0}, {ID: 4, count: 1}];
    let queryResults: any[] = [{ID: 1, contracts: '2'},  {ID: 4, contracts: '1'}];
    let getResumeDTO: GetResumesDTO = {searchFilter: '?currentPage=0&itemsPrPage=25', shouldLoadResumeCount: true};

    jest.spyOn(mockResumeRepository.createQueryBuilder(), 'getRawMany')
      .mockImplementationOnce(() => {return new Promise(resolve => {resolve(queryResults);});})

    let result: Resume[];

    await expect(result = await service.getResumesCount(resumes, getResumeDTO)).resolves;
    expect(result).toStrictEqual(expectedResult);
    expect(mockResumeRepository.createQueryBuilder().getRawMany).toHaveBeenCalledTimes(1);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledTimes(2);
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Pending review');
    expect(mockStatusService.findStatusByName).toHaveBeenCalledWith('Accepted');
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
