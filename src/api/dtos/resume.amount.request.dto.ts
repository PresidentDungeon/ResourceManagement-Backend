import { Resume } from "../../core/models/resume";

export interface ResumeAmountRequestDTO {
  resumes: Resume[]
  excludeContract?: number
}
