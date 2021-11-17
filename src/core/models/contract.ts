import { User } from "./user";
import { Resume } from "./resume";
import { Status } from "./status";

export interface Contract {
  ID: number
  title: string
  status: Status
  startDate: Date
  endDate: Date
  users: User[]
  resumes: Resume[]
}
