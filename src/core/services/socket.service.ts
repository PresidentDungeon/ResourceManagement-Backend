import { Injectable } from '@nestjs/common';
import { ISocketService } from "../primary-ports/socket.service.interface";
import { Server } from "socket.io";
import { UserDTO } from "../../api/dtos/user.dto";
import { User } from "../models/user";
import { Contract } from "../models/contract";

@Injectable()
export class SocketService implements ISocketService{

  public server: Server = null;

  constructor() {}

  setServer(socket: Server) {
    this.server = socket;
  }

  emitContractCreateEvent(contract: Contract) {
    this.server.emit('contractCreated', contract);
  }

  emitContractUpdateEvent(contract: Contract) {
    this.server.emit('contractUpdatedAdmin', contract);
    this.server.emit('contractUpdatedUser', this.redactContract(contract));
  }

  emitContractDeleteEvent(contract: Contract) {
    this.server.emit('contractDeleted', contract);
  }

  redactContract(contract: Contract): Contract{
    contract.users = [];
    contract.resumes.map((resume) => {resume.firstName = ''; resume.middleName = ''; resume.lastName = ''; resume.middleLastName = '';});
    return contract;
}



}
