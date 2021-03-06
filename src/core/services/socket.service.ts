import { Injectable } from '@nestjs/common';
import { ISocketService } from "../primary-ports/application-services/socket.service.interface";
import { Server } from "socket.io";
import { Contract } from "../models/contract";

@Injectable()
export class SocketService implements ISocketService{

  public server: Server = null;

  constructor() {}

  setServer(socket: Server): void {
    this.server = socket;
  }

  emitContractCreateEvent(contract: Contract): void {
    this.server.emit('contractCreated', contract);
  }

  emitContractUpdateEvent(contract: Contract): void {
    this.server.emit('contractUpdatedAdmin', contract);
  }

  emitContractDeleteEvent(contract: Contract): void {
    this.server.emit('contractDeleted', contract);
  }

  redactContract(contract: Contract): Contract{
    contract.users = [];
    contract.resumes.map((resume) => {resume.firstName = ''; resume.middleName = ''; resume.lastName = ''; resume.middleLastName = '';});
    return contract;
  }

}
