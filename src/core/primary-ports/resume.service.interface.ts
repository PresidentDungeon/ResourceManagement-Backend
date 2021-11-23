import { Resume } from "../models/resume";
import { FilterList } from "../models/filterList";

export const IResumeServiceProvider = 'IResumeServiceProvider'
export interface IResumeService{


  getResumeByID(resumeID: number, redact: boolean): Promise<Resume>
  getResumesByID(simpleResume: Resume[], redact: boolean): Promise<Resume[]>
  getResumes(filter: string, getResumeCount: boolean, excludeContract?: number): Promise<FilterList<Resume>>
  getResumeCount(ID: number): Promise<number>
  getResumesCount(resumes: Resume[], excludeContract?: number): Promise<Resume[]>
  redactResume(resume: Resume): Resume
}
