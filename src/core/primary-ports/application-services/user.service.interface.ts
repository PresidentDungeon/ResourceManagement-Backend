import { User } from '../../models/user';
import { Filter } from "../../models/filter";
import { FilterList } from "../../models/filterList";
import { UserDTO } from "../../../api/dtos/user.dto";
import { Role } from "../../models/role";
import { Status } from "../../models/status";

export const IUserServiceProvider = 'IUserServiceProvider'
export interface IUserService{

  createUser(username: string, password: string): Promise<User>
  registerUser(username: string): Promise<User>
  addUser(user: User): Promise<[User, string]>
  getUserByUsername(username: string): Promise<User>
  getUsersByWhitelistDomain(domain: string): Promise<User[]>
  getUserByID(ID: number): Promise<User>
  getUsers(filter: Filter): Promise<FilterList<UserDTO>>
  getUsernames(username: string): Promise<string[]>
  updateUser(userDTO: UserDTO): Promise<User>

  login(username: string, password: string): Promise<User>
  generateNewVerificationCode(user: User): Promise<string>
  generatePasswordResetToken(username: string): Promise<string>
  verifyUser(username: string, verificationCode: string): Promise<void>
  verifyUserConfirmationToken(user: User, confirmationCode: string): Promise<void>
  verifyPasswordToken(user: User, passwordToken: string): Promise<void>

  updatePasswordWithConfirmationToken(username: string, confirmationToken: string, password: string): Promise<boolean>
  updatePasswordWithToken(username: string, passwordToken: string, password: string): Promise<boolean>
  updatePasswordWithID(userID: number, password: string, oldPassword: string): Promise<boolean>
  updatePassword(user: User, password: string): Promise<boolean>

  generateSalt(): string
  generateHash(password: string, salt: string): string
  generateJWTToken(user: User): string
  verifyJWTToken(token: string): boolean

  verifyUserEntity(user: User): void
  verifyUserApprovedStatus(userID: number): Promise<boolean>

  getAllUserRoles(): Promise<Role[]>
  getAllStatuses(): Promise<Status[]>
}


