import { Whitelist } from "../models/whitelist";

export const IWhitelistServiceProvider = 'IWhitelistServiceProvider'
export interface IWhitelistService{

  addWhitelist(whitelist: Whitelist): Promise<Whitelist>
  getWhitelistByID(ID: number): Promise<Whitelist>
  updateWhitelist(whitelist: Whitelist): Promise<Whitelist>
  deleteWhitelist(whitelist: Whitelist): Promise<void>
  verifyWhitelist(whitelist: Whitelist): void
  verifyUserWhitelist(username: string): Promise<boolean>
}
