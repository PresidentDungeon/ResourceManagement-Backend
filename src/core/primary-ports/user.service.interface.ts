import { User } from '../models/user';

export const IUserServiceProvider = 'IUserServiceProvider'
export interface IUserService{

  generateSalt(): string
  generateHash(password: string, salt: string): string
  generateJWTToken(user: User): string

  login(username: string, password: string): Promise<User>
  verifyJWTToken(token: string): boolean

  verifyUser(user: User): void
}
