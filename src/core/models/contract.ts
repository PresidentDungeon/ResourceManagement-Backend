import { User } from "./user";
import { Resume } from "./resume";

export interface Contract {
  ID: number
  title: string
  status: string
  startDate: Date
  endDate: Date
  users: User[]
  resumes: Resume[]
}
