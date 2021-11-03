import { User } from '../models/user';
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";
import { UserDTO } from "../../api/dtos/user.dto";

export const IUserServiceProvider = 'IUserServiceProvider'
export interface IUserService{

  createUser(username: string, password: string): User
  addUser(user: User): Promise<[User, string]>
  verifyUser(username: string, verificationCode: string)
  getUserByUsername(username: string): Promise<User>
  getUsers(filter: Filter): Promise<FilterList<UserDTO>>
  updateUser(userDTO: UserDTO): Promise<User>

  generateSalt(): string
  generateHash(password: string, salt: string): string
  generateJWTToken(user: User): string
  generateNewVerificationCode(user: User): Promise<string>
  generatePasswordResetToken(username: string): Promise<string>

  login(username: string, password: string): Promise<User>
  verifyJWTToken(token: string): boolean
  verifyPasswordToken(user: User, passwordToken: string)
  updatePassword(username: string, passwordToken: string, password: string)

  verifyUserEntity(user: User): void
}
