import { Status } from "../models/status";

export const IStatusServiceProvider = 'IStatusServiceProvider'
export interface IStatusService{

  findStatusByName(role: String): Promise<Status>
  getStatuses(): Promise<Status[]>

}
