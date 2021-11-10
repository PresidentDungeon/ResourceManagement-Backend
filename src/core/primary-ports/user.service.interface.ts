import { User } from '../models/user';
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";
import { UserDTO } from "../../api/dtos/user.dto";
import { Role } from "../models/role";
import { Status } from "../models/status";

export const IUserServiceProvider = 'IUserServiceProvider'
export interface IUserService{

  createUser(username: string, password: string): Promise<User>
  addUser(user: User): Promise<[User, string]>
  verifyUser(username: string, verificationCode: string)
  getUserByUsername(username: string): Promise<User>
  getUserByID(ID: number): Promise<User>
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
  updatePasswordWithToken(username: string, passwordToken: string, password: string): Promise<boolean>
  updatePasswordWithID(userID: number, password: string, oldPassword: string): Promise<boolean>
  updatePassword(user: User, password: string): Promise<boolean>

  verifyUserEntity(user: User): void

  getAllUserRoles(): Promise<Role[]>
  getAllStatuses(): Promise<Status[]>
}
