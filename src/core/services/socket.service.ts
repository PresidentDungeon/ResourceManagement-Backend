import { Injectable } from '@nestjs/common';
import { ISocketService } from "../primary-ports/socket.service.interface";
import { Server } from "socket.io";
import { UserDTO } from "../../api/dtos/user.dto";
import { User } from "../models/user";

@Injectable()
export class SocketService implements ISocketService{

  public server: Server = null;

  constructor() {}

  setServer(socket: Server) {
    this.server = socket;
  }

  emitUserCreateEvent(user: User) {
    this.server.emit('userCreated', this.convertUserToDTO(user));
  }

  emitUserUpdateEvent(user: User) {
    this.server.emit('userUpdated', this.convertUserToDTO(user));
  }

  emitUserDeleteEvent(user: User) {
    this.server.emit('userDeleted', this.convertUserToDTO(user));
  }

  convertUserToDTO(user: User): UserDTO{
    return {ID: user.ID, username: user.username, status: user.status, role: user.role}
  }



}
