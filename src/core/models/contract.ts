import { User } from "./user";
import { Contractor } from "./contractor";

export interface Contract {
  ID: number
  title: string
  status: string
  startDate: Date
  endDate: Date
  users: User[]
  contractors: Contractor[]
}
