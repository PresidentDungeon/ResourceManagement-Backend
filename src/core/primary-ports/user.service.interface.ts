import { User } from '../models/user';
import { UserEntity } from "../../infrastructure/data-source/postgres/entities/user.entity";

export const IUserServiceProvider = 'IUserServiceProvider'
export interface IUserService{

  createUser(username: string, password: string): User
  addUser(user: User): Promise<User>
  verifyUser(ID: number, verificationCode: string)
  getUserByUsername(username: string): Promise<[User, string]>

  generateSalt(): string
  generateHash(password: string, salt: string): string
  generateJWTToken(user: User): string

  login(username: string, password: string): Promise<[User, string]>
  verifyJWTToken(token: string): boolean

  verifyUserEntity(user: User): void
}
