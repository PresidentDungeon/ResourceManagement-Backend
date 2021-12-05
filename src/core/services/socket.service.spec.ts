import { Test, TestingModule } from '@nestjs/testing';
import { SocketService } from './socket.service';
import { Server } from "socket.io";
import { Connection } from "typeorm";
import { Contract } from "../models/contract";
import { Filter } from "../models/filter";
import theoretically from "jest-theories";
import { Resume } from "../models/resume";

describe('SocketService', () => {
  let service: SocketService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocketService],
    }).compile();

    service = module.get<SocketService>(SocketService);
  });

  it('Socket service should be defined', () => {
    expect(service).toBeDefined();
  });

  //#region SetServer

  it('Set server changes server instance variable', () => {

    const websocket: any = {}

    expect(service.server).toBeNull();
    expect(service.setServer(websocket)).resolves;
    expect(service.server).toBe(websocket);
  });

  //#endregion

  //#region EmitContractCreateEvent

  it('Calling emit contract create event resolves correctly', () => {

    let contract: Contract = {ID: 1, title: 'Mærsk', description: 'Some company', isVisibleToDomainUsers: false, status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: [], whitelists: []};

    const websocket: any = { emit: jest.fn(() => {}) }
    service.server = websocket;

    expect(service.emitContractCreateEvent(contract)).resolves;
    expect(service.server.emit).toHaveBeenCalledTimes(1);
    expect(service.server.emit).toHaveBeenCalledWith('contractCreated', contract);
  });

  //#endregion

  //#region EmitContractUpdateEvent

  it('Calling emit contract update event resolves correctly', () => {

    let contract: Contract = {ID: 1, title: 'Mærsk', description: 'Some company', isVisibleToDomainUsers: false, status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: [], whitelists: []};

    jest.spyOn(service, 'redactContract').mockImplementation((contract: Contract) => {return contract});
    const websocket: any = { emit: jest.fn(() => {})}
    service.server = websocket;

    expect(service.emitContractUpdateEvent(contract)).resolves;
    expect(service.server.emit).toHaveBeenCalledTimes(2);
    expect(service.server.emit).toHaveBeenCalledWith('contractUpdatedAdmin', contract);
    expect(service.server.emit).toHaveBeenCalledWith('contractUpdatedUser', contract);
  });

  //#endregion

  //#region EmitContractCreateEvent

  it('Calling emit contract delete event resolves correctly', () => {

    let contract: Contract = {ID: 1, title: 'Mærsk', description: 'Some company', isVisibleToDomainUsers: false, status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [], resumeRequests: [], whitelists: []};

    const websocket: any = { emit: jest.fn(() => {}) }
    service.server = websocket;

    expect(service.emitContractDeleteEvent(contract)).resolves;
    expect(service.server.emit).toHaveBeenCalledTimes(1);
    expect(service.server.emit).toHaveBeenCalledWith('contractDeleted', contract);
  });

  //#endregion

  //#region RedactContract

  describe('Redact contract redacts as expected',  () => {

    let contractToRedact: Contract;
    let expectedRedactedResumes: Resume[];

    const theories = [
      { input: contractToRedact =
          {ID: 1, title: 'Mærsk', description: 'Some company', isVisibleToDomainUsers: false, status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [
              {ID: 1, firstName: 'Hans', middleName: 'Joachim', lastName: 'Madsen', middleLastName: 'Joachim Madsen'},
              {ID: 2, firstName: 'Lars', middleName: 'Elis', lastName: 'Hansen', middleLastName: 'Elis Hansen'},
              {ID: 3, firstName: 'Jacob', middleName: 'Geert', lastName: 'Olsen', middleLastName: 'Geert Olsen'}
            ], users: [],resumeRequests: [], whitelists: []},
        expectedRedactedResumes: [
          {ID: 1, firstName: '', middleName: '', lastName: '', middleLastName: ''},
          {ID: 2, firstName: '', middleName: '', lastName: '', middleLastName: ''},
          {ID: 3, firstName: '', middleName: '', lastName: '', middleLastName: ''}
        ]},
      { input: contractToRedact =
          {ID: 1, title: 'Mærsk', description: 'Some company', isVisibleToDomainUsers: false, status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [], users: [],resumeRequests: [], whitelists: []},
        expectedRedactedResumes: []},
      { input: contractToRedact =
          {ID: 1, title: 'Mærsk', description: 'Some company', isVisibleToDomainUsers: false, status: {ID: 1, status: 'Draft'}, startDate: new Date(), endDate: new Date(), resumes: [
              {ID: 1, firstName: 'Hans', middleName: 'Joachim', lastName: 'Madsen', middleLastName: 'Joachim Madsen'}
            ], users: [],resumeRequests: [], whitelists: []},
        expectedRedactedResumes: [
          {ID: 1, firstName: '', middleName: '', lastName: '', middleLastName: ''}
        ]},
    ];

    theoretically('The contract is redacted successfully', theories,  async theory => {

      let result: Contract;

      await expect(result = await service.redactContract(theory.input)).resolves;
      expect(result.resumes).toStrictEqual(theory.expectedRedactedResumes);
    });
  });






  //#endregion



});
