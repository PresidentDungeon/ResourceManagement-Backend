import { Contract } from "../models/contract";
import { Status } from "../models/status";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";
import { CommentDTO } from "src/api/dtos/comment.dto";
import { Comment } from "../models/comment";

export const IContractServiceProvider = 'IContractServiceProvider'
export interface IContractService{

  addContract(contract: Contract): Promise<Contract>
  addRequestContract(contract: Contract): Promise<Contract>
  saveComment(commentDTO: CommentDTO): Promise<void>
  getContractComments(ID: number): Promise<Comment[]>
  getContractByID(ID: number, redact?: boolean, userID?: number): Promise<Contract>
  getContractsByUserID(userID: number, statusID: number): Promise<Contract[]>
  getContractsByResume(ID: number): Promise<Contract[]>
  getContracts(filter: Filter): Promise<FilterList<Contract>>
  confirmContract(contract: Contract, isAccepted: boolean): Promise<Contract>
  requestRenewal(contract: Contract): Promise<Contract>
  update(contract: Contract): Promise<Contract>
  delete(ID: number): Promise<void>

  verifyContractEntity(contract: Contract)
  verifyContractStatuses(contracts: Contract[]): Promise<Contract[]>;

  getAllStatuses(): Promise<Status[]>
  getAllUserStatuses(): Promise<Status[]>
}
