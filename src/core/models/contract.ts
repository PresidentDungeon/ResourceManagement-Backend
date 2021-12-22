import { User } from "./user";
import { Resume } from "./resume";
import { Status } from "./status";
import { ResumeRequest } from "./resume-request";
import { Comment } from "./comment";
import { Whitelist } from "./whitelist";

export interface Contract {
  ID: number
  title: string
  description: string
  isVisibleToDomainUsers: boolean
  status: Status
  startDate: Date
  endDate: Date
  dueDate?: Date
  resumeRequests: ResumeRequest[]
  users: User[]
  resumes: Resume[]
  whitelists: Whitelist[]

  comments?: Comment[]
  commentCount?: number
  personalComment?: Comment
}
