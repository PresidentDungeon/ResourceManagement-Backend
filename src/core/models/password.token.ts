import { User } from "./user";

export interface PasswordToken {
  user: User
  hashedResetToken: string
  time?: Date
}
