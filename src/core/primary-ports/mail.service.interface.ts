import { User } from "../models/user";

export const IMailServiceProvider = 'IMailServiceProvider'
export interface IMailService{
  sendUserConfirmation(email: string, verificationCode: string)
  sendUserPasswordReset(email: string, passwordResetToken: string)
  sendUserPasswordResetConfirmation(email: string)
}
