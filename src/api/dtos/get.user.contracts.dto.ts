import { Contract } from "../../core/models/contract";

export interface GetUserContractsDTO {
  personalContract: Contract[],
  domainContracts: Contract[]
}
