import { User } from "../../models/user";
import { PasswordToken } from "../../models/password.token";

export const IAuthenticationHelperProvider = 'IAuthenticationHelperProvider'
export interface IAuthenticationHelper {
  getSecretKey(): string
  generateToken(tokenLength: number): string
  generateHash(password: string, salt: string): string
  validateLogin(userToValidate: User, password: string): void
  generateJWT(user: User): string
  validateJWT(token: string): boolean
  validatePasswordToken(passwordToken: PasswordToken): boolean
}
