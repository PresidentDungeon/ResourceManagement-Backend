import { Contract } from "../models/contract";
import { Resume } from "../models/resume";
import { Status } from "../models/status";

export const IContractServiceProvider = 'IContractServiceProvider'
export interface IContractService{

  addContract(contract: Contract): Promise<Contract>
  getContractByID(ID: number): Promise<Contract>
  update(contract: Contract): Promise<Contract>
  delete(ID: number)
  getResumeCount(ID: number): Promise<number>
  getResumesCount(contractors: Resume[]): Promise<Resume[]>

  verifyContractEntity(contract: Contract)

  getAllStatuses(): Promise<Status[]>
}
