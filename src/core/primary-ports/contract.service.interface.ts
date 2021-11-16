import { Contract } from "../models/contract";
import { User } from "../models/user";
import { Resume } from "../models/resume";

export const IContractServiceProvider = 'IContractServiceProvider'
export interface IContractService{

  addContract(contract: Contract): Promise<Contract>
  getContractByID(ID: number): Promise<Contract>
  update(contract: Contract): Promise<Contract>
  delete(ID: number)
  getResumeCount(ID: number): Promise<number>
  getResumesCount(contractors: Resume[]): Promise<Resume[]>

  verifyContractEntity(contract: Contract)
}
