import { User } from "../models/user";

export const IMailServiceProvider = 'IMailServiceProvider'
export interface IMailService{
  sendUserConfirmation(user: User, verificationCode: string)
}
