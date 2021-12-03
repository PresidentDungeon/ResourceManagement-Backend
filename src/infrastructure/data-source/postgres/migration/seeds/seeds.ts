import { RoleEntity } from "../../entities/role.entity";
import { UserStatusEntity } from "../../entities/user-status.entity";
import { ContractStatusEntity } from "../../entities/contract-status.entity";

export const RoleSeed: RoleEntity[] = [
  {ID: 1, role: 'User'},
  {ID: 2, role: 'Admin'},
]

export const UserStatusSeed: UserStatusEntity[] = [
  {ID: 1, status: 'Pending'},
  {ID: 2, status: 'Active'},
  {ID: 3, status: 'Whitelisted'},
  {ID: 4, status: 'Disabled'},
]

export const ContractStatusSeed: ContractStatusEntity[] = [
  {ID: 1, status: 'Request'},
  {ID: 2, status: 'Draft'},
  {ID: 3, status: 'Pending review'},
  {ID: 4, status: 'Expired'},
  {ID: 5, status: 'Accepted'},
  {ID: 6, status: 'Rejected'},
  {ID: 7, status: 'Completed'},
]
