import { Contract } from "../models/contract";
import { User } from "../models/user";
import { Contractor } from "../models/contracter";

export const IContractServiceProvider = 'IContractServiceProvider'
export interface IContractService{

  addContract(contract: Contract): Promise<Contract>
  getContractByID(ID: number): Promise<Contract>
  update(contract: Contract): Promise<Contract>
  delete(ID: number)
  getContractorCount(ID: number)
  verifyContractEntity(contract: Contract)

  getContractorsCount(contractors: Contractor[])
}
