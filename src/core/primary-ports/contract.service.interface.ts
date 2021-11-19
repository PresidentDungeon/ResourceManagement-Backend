import { Contract } from "../models/contract";
import { Resume } from "../models/resume";
import { Status } from "../models/status";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";

export const IContractServiceProvider = 'IContractServiceProvider'
export interface IContractService{

  addContract(contract: Contract): Promise<Contract>
  getContractByID(ID: number): Promise<Contract>
  getContractByUserID(ID: number): Promise<Contract[]>
  getContracts(filter: Filter): Promise<FilterList<Contract>>
  confirmContract(contract: Contract, isAccepted: boolean): Promise<Contract>
  update(contract: Contract): Promise<Contract>
  delete(ID: number)
  getResumeCount(ID: number): Promise<number>
  getResumesCount(contractors: Resume[], excludeContract?: number): Promise<Resume[]>

  verifyContractEntity(contract: Contract)

  getAllStatuses(): Promise<Status[]>
}
