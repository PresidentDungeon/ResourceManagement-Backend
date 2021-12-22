import { User } from "./user";

export interface ConfirmationToken {
  user: User
  salt: string
  hashedConfirmationToken: string
}
