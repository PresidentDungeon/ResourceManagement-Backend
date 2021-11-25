import { Inject, Injectable } from "@nestjs/common";
import { Resume } from "../models/resume";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { AxiosResponse } from "axios";
import { FilterList } from "../models/filterList";
import { InjectRepository } from "@nestjs/typeorm";
import { ResumeEntity } from "../../infrastructure/data-source/postgres/entities/resume.entity";
import { Repository } from "typeorm";
import { Status } from "../models/status";
import {
  IContractStatusService,
  IContractStatusServiceProvider
} from "../primary-ports/contract-status.service.interface";

@Injectable()
export class ResumeService {

  constructor(
    @InjectRepository(ResumeEntity) private resumeRepository: Repository<ResumeEntity>,
    @Inject(IContractStatusServiceProvider) private statusService: IContractStatusService,
    private http: HttpService,
    private configService: ConfigService) {}

  async getResumeByID(resumeID: number, redact: boolean): Promise<Resume>{

    let axiosResume: AxiosResponse<Resume>;

    try{axiosResume = await this.http.get(this.configService.get('MOCK_API_URL') + `/resume/getResumeByID?ID=${resumeID}`).toPromise();}
    catch (e) {throw new Error('No resume found with such an ID');}

    let resume: Resume = axiosResume.data;
    return (redact) ? this.redactResume(resume) : resume;
  }

  async getResumesByID(simpleResume: Resume[], redact: boolean): Promise<Resume[]>{

    let IDs: number[] = simpleResume.map((resume) => {return resume.ID});
    let resumes: Resume[] = []
    const promises: Promise<Resume>[] = []

    IDs.forEach((resumeID) => {
        const promise: Promise<Resume> = this.getResumeByID(resumeID, redact);
        promise.then((resume) => {resumes.push(resume)}).catch((error) => {});
        promises.push(promise);
    });

    await Promise.all(promises.map(p => p.catch(e => e))).then().catch();

    resumes.sort((resume1, resume2) => {return resume1.ID - resume2.ID});

    return resumes;
  }

  async getResumes(filter: string, getResumeCount: boolean, excludeContract?: number): Promise<FilterList<Resume>>{
    const axiosResume: AxiosResponse<FilterList<Resume>> = await this.http.get(this.configService.get('MOCK_API_URL') + `/resume/getResumes` + filter).toPromise();
    const resumes: FilterList<Resume> = axiosResume.data;

    if(getResumeCount){
      await this.getResumesCount(resumes.list, excludeContract)
    }

    return resumes;
  }

  async getResumeCount(ID: number): Promise<number> {

    if(ID == null || ID <= 0){
      throw new Error('Resume ID must be instantiated or valid');
    }

    let draftStatus: Status = await this.statusService.findStatusByName('Draft');
    let pendingStatus: Status = await this.statusService.findStatusByName('Pending review');
    let statusIDs: number[] = [draftStatus.ID, pendingStatus.ID];

    let qb = this.resumeRepository.createQueryBuilder('resume');
    qb.leftJoin('resume.contracts', 'contracts');
    qb.leftJoin('contracts.status', 'status');
    qb.andWhere('status.ID IN (:...statusIDs)', {statusIDs: statusIDs});
    qb.andWhere('resume.ID = :resumeID', {resumeID: `${ID}`});
    qb.addSelect('COUNT(DISTINCT(contracts.ID)) as contracts');
    qb.groupBy('resume.ID');

    const result = await qb.getRawOne();

    return Number.parseInt(result.contracts)
  }

  async getResumesCount(resumes: Resume[], excludeContract?: number): Promise<Resume[]> {

    let resumeIDs: number[] = [];
    resumes.map((resume) => {resumeIDs.push(resume.ID); resume.count = 0});

    let draftStatus: Status = await this.statusService.findStatusByName('Draft');
    let pendingStatus: Status = await this.statusService.findStatusByName('Pending review');
    let statusIDs: number[] = [draftStatus.ID, pendingStatus.ID];

    let qb = this.resumeRepository.createQueryBuilder('resume');
    qb.leftJoin('resume.contracts', 'contracts');
    qb.leftJoin('contracts.status', 'status');
    qb.andWhere('status.ID IN (:...statusIDs)', {statusIDs: statusIDs});
    qb.andWhere('resume.ID IN (:...resumeIDs)', {resumeIDs: resumeIDs});

    if(excludeContract != null && excludeContract > 0){
      qb.andWhere('contracts.ID != :contractID', {contractID: excludeContract});
    }

    qb.select('resume.ID', 'ID');
    qb.addSelect('COUNT(DISTINCT(contracts.ID)) as contracts');
    qb.groupBy('resume.ID');

    const result = await qb.getRawMany();
    let convertedValues: Resume[] = result.map((value) => {return {ID: value.ID as number, count: Number.parseInt(value.contracts)}})

    resumes.map((resumeValue) => {const foundValue = convertedValues.find(item => item.ID == resumeValue.ID); if(foundValue){resumeValue.count = foundValue.count}});
    return resumes;
  }

  redactResume(resume: Resume): Resume{
    resume.firstName = '';
    resume.middleName = '';
    resume.lastName = '';
    resume.middleLastName = '';
    return resume;
  }


}