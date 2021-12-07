export const IMailHelperProvider = 'IMailHelperProvider'
export interface IMailHelper{
  sendUserConfirmation(email: string, verificationCode: string)
  sendUserRegistrationInvite(email: string, confirmationCode: string)
  sendUserPasswordReset(email: string, passwordResetToken: string)
  sendUserPasswordResetConfirmation(email: string)
}
