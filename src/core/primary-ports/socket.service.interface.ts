import { Server } from 'socket.io';
import { User } from "../models/user";

export const ISocketServiceProvider = 'ISocketServiceProvider'
export interface ISocketService{

  setServer(socket: Server)
  emitUserCreateEvent(user: User)
  emitUserUpdateEvent(user: User)
  emitUserDeleteEvent(user: User)
}
