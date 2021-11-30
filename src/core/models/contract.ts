import { User } from "./user";
import { Resume } from "./resume";
import { Status } from "./status";
import { ResumeRequest } from "./resume-request";
import { Comment } from "./comment";

export interface Contract {
  ID: number
  title: string
  description: string
  status: Status
  startDate: Date
  endDate: Date
  dueDate?: Date
  resumeRequests: ResumeRequest[]
  users: User[]
  resumes: Resume[]

  comments?: Comment[]
  personalComment?: Comment
}
