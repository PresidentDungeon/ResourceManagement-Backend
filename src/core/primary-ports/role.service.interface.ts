import { Role } from "../models/role";

export const IRoleServiceProvider = 'IRoleServiceProvider'
export interface IRoleService{

  findRoleByName(role: String): Promise<Role>
}
