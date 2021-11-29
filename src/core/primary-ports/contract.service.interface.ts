import { Contract } from "../models/contract";
import { Resume } from "../models/resume";
import { Status } from "../models/status";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";

export const IContractServiceProvider = 'IContractServiceProvider'
export interface IContractService{

  addContract(contract: Contract): Promise<Contract>
  addRequestContract(contract: Contract): Promise<Contract>
  getContractByID(ID: number, redact?: boolean, userID?: number): Promise<Contract>
  getContractByUserID(ID: number): Promise<Contract[]>
  getContractsByResume(ID: number): Promise<Contract[]>
  getContracts(filter: Filter): Promise<FilterList<Contract>>
  confirmContract(contract: Contract, isAccepted: boolean): Promise<Contract>
  requestRenewal(contract: Contract): Promise<Contract>
  update(contract: Contract): Promise<Contract>
  delete(ID: number)

  verifyContractEntity(contract: Contract)
  verifyContractStatuses(contracts: Contract[]): Promise<Contract[]>;

  getAllStatuses(): Promise<Status[]>
}
