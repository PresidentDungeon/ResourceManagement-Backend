import { Role } from "../../core/models/role";
import { Status } from "../../core/models/status";

export interface UserDTO {
  ID: number
  username: string
  status: Status
  role: Role
}
