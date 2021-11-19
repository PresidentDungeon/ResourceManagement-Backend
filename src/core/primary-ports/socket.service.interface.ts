import { Server } from 'socket.io';
import { User } from "../models/user";
import { Contract } from "../models/contract";

export const ISocketServiceProvider = 'ISocketServiceProvider'
export interface ISocketService{

  setServer(socket: Server)
  emitContractCreateEvent(contract: Contract)
  emitContractUpdateEvent(contract: Contract)
  emitContractDeleteEvent(contract: Contract)
}
