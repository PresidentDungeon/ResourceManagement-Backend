import { Role } from "../../models/role";

export const IRoleServiceProvider = 'IRoleServiceProvider'
export interface IRoleService{

  findRoleByName(role: string): Promise<Role>
  getRoles(): Promise<Role[]>

}
