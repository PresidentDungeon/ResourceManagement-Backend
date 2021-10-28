import { User } from '../models/user';

export const IUserServiceProvider = 'IUserServiceProvider'
export interface IUserService{

  createUser(username: string, password: string): User
  addUser(user: User): Promise<User>

  generateSalt(): string
  generateHash(password: string, salt: string): string
  generateJWTToken(user: User): string

  login(username: string, password: string): Promise<[User, string]>
  verifyJWTToken(token: string): boolean

  verifyUser(user: User): void
}
