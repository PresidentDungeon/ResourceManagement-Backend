import { Role } from "./role";

export interface User {
  ID: number
  username: string
  password: string
  salt: string
  role: Role
  status?: string
  verificationCode?: string
}
