import { Status } from "../models/status";

export const IUserStatusServiceProvider = 'IUserStatusServiceProvider'
export interface IUserStatusService{

  findStatusByName(role: String): Promise<Status>
  getStatuses(): Promise<Status[]>

}
