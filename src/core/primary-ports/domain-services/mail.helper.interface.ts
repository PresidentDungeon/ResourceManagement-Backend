export const IMailHelperProvider = 'IMailHelperProvider'
export interface IMailHelper{
  sendUserConfirmation(email: string, verificationCode: string): Promise<void>
  sendUserRegistrationInvite(email: string, confirmationCode: string): Promise<void>
  sendUserPasswordReset(email: string, passwordResetToken: string): Promise<void>
  sendUserPasswordResetConfirmation(email: string): Promise<void>
}
