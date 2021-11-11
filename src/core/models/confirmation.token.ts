import { User } from "./user";

export interface ConfirmationToken {
  user: User
  hashedConfirmationToken: string
}
