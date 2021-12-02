import { Status } from "../models/status";

export const IContractStatusServiceProvider = 'IContractStatusServiceProvider'
export interface IContractStatusService{

  findStatusByName(role: String): Promise<Status>
  getStatuses(): Promise<Status[]>
  getUserStatus(): Promise<Status[]>

}
