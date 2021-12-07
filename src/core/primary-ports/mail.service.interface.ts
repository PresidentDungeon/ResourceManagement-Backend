export const IMailServiceProvider = 'IMailServiceProvider'
export interface IMailService{
  sendUserConfirmation(email: string, verificationCode: string)
  sendUserRegistrationInvite(email: string, confirmationCode: string)
  sendUserPasswordReset(email: string, passwordResetToken: string)
  sendUserPasswordResetConfirmation(email: string)
}
