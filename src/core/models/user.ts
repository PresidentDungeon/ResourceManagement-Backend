import { Role } from "./role";
import { Status } from "./status";

export interface User {
  ID: number
  username: string
  password: string
  salt: string
  role: Role
  status: Status
}
