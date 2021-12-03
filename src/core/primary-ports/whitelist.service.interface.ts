import { Whitelist } from "../models/whitelist";
import { Filter } from "../models/filter";
import { FilterList } from "../models/filterList";

export const IWhitelistServiceProvider = 'IWhitelistServiceProvider'
export interface IWhitelistService{

  addWhitelist(whitelist: Whitelist): Promise<Whitelist>
  getWhitelists(filter: Filter): Promise<FilterList<Whitelist>>
  getWhitelistByID(ID: number): Promise<Whitelist>
  updateWhitelist(whitelist: Whitelist): Promise<Whitelist>
  deleteWhitelist(whitelist: Whitelist): Promise<void>
  verifyWhitelist(whitelist: Whitelist): void
  verifyUserWhitelist(username: string): Promise<boolean>
}
