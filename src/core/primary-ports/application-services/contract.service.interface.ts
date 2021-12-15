import { Contract } from "../../models/contract";
import { Status } from "../../models/status";
import { Filter } from "../../models/filter";
import { FilterList } from "../../models/filterList";
import { CommentDTO } from "src/api/dtos/comment.dto";
import { Comment } from "../../models/comment";
import { GetUserContractsDTO } from "../../../api/dtos/get.user.contracts.dto";

export const IContractServiceProvider = 'IContractServiceProvider'
export interface IContractService{

  addContract(contract: Contract): Promise<Contract>
  addRequestContract(contract: Contract, username: string, status: string): Promise<Contract>
  saveComment(commentDTO: CommentDTO): Promise<void>
  getContractComments(ID: number): Promise<Comment[]>
  getContractByID(ID: number, redact?: boolean, userID?: number): Promise<Contract>
  getContractsByUserID(userID: number, username: string, statusID: number, displayDomainContract: boolean): Promise<GetUserContractsDTO>
  getContractsByResume(ID: number): Promise<Contract[]>
  getContracts(filter: Filter): Promise<FilterList<Contract>>
  confirmContract(contract: Contract, userID: number, isAccepted: boolean): Promise<Contract>
  requestRenewal(contract: Contract, userID: number): Promise<Contract>
  update(contract: Contract): Promise<Contract>
  delete(ID: number): Promise<void>

  verifyContractEntity(contract: Contract): void
  verifyUserRegistrationToContract(contract: Contract, userID: number): Promise<void>
  verifyContractStatuses(contracts: Contract[]): Promise<Contract[]>;

  getAllStatuses(): Promise<Status[]>
  getAllUserStatuses(): Promise<Status[]>
}
