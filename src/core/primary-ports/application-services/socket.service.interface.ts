import { Server } from 'socket.io';
import { Contract } from "../../models/contract";

export const ISocketServiceProvider = 'ISocketServiceProvider'
export interface ISocketService{

  setServer(socket: Server): void
  emitContractCreateEvent(contract: Contract): void
  emitContractUpdateEvent(contract: Contract): void
  emitContractDeleteEvent(contract: Contract): void
  redactContract(contract: Contract): Contract
}
