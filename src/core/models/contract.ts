import { User } from "./user";
import { Contractor } from "./contracter";

export interface Contract {
  ID: number
  title: string
  status: string
  startDate: Date
  endDate: Date
  users: User[]
  contractors: Contractor[]
}
