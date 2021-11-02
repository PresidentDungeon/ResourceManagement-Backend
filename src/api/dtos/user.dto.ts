import { Role } from "../../core/models/role";

export interface UserDTO {
  ID: number
  username: string
  status: string
  role: Role
}
