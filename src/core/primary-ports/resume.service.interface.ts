import { Resume } from "../models/resume";
import { FilterList } from "../models/filterList";
import { GetResumesDTO } from "../../api/dtos/get.resumes.dto";

export const IResumeServiceProvider = 'IResumeServiceProvider'
export interface IResumeService{


  getResumeByID(resumeID: number, redact: boolean): Promise<Resume>
  getResumesByID(simpleResume: Resume[], redact: boolean): Promise<Resume[]>
  getResumes(getResumeDTO: GetResumesDTO): Promise<FilterList<Resume>>
  getResumeCount(ID: number): Promise<number>
  getResumesCount(resumes: Resume[], getResumeDTO: GetResumesDTO): Promise<Resume[]>
  redactResume(resume: Resume): Resume
}
