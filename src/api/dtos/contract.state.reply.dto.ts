import { Contract } from "../../core/models/contract";

export interface ContractStateReplyDTO {
  contract: Contract
  isAccepted: boolean
}
