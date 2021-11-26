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
import { IResumeService } from "../primary-ports/resume.service.interface";
import { GetResumesDTO } from "../../api/dtos/get.resumes.dto";

@Injectable()
export class ResumeService implements IResumeService{

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
    let axiosResume: AxiosResponse<Resume[]>;

    try{axiosResume = await this.http.post(this.configService.get('MOCK_API_URL') + `/resume/getResumesByID`, IDs).toPromise();}
    catch (e) {throw new Error('Internal server error');}

    let resumes: Resume[] = axiosResume.data;

    if(redact){for(let i = 0; i < resumes.length; i++){resumes[i] = this.redactResume(resumes[i]);}}

    return resumes;
  }

  async getResumes(getResumeDTO: GetResumesDTO): Promise<FilterList<Resume>>{
    const axiosResume: AxiosResponse<FilterList<Resume>> = await this.http.get(this.configService.get('MOCK_API_URL') + `/resume/getResumes` + getResumeDTO.searchFilter).toPromise();
    const resumes: FilterList<Resume> = axiosResume.data;
    if(getResumeDTO.shouldLoadResumeCount && resumes.list.length > 0){
      await this.getResumesCount(resumes.list, getResumeDTO)
    }

    return resumes;
  }

  async getResumeCount(ID: number): Promise<number> {

    if(ID == null || ID <= 0){
      throw new Error('Resume ID must be instantiated or valid');
    }

    let pendingStatus: Status = await this.statusService.findStatusByName('Pending review');
    let acceptedStatus: Status = await this.statusService.findStatusByName('Accepted');
    let statusIDs: number[] = [pendingStatus.ID, acceptedStatus.ID];

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

  async getResumesCount(resumes: Resume[], getResumeDTO: GetResumesDTO): Promise<Resume[]> {

    let resumeIDs: number[] = [];
    resumes.map((resume) => {resumeIDs.push(resume.ID); resume.count = 0});

    let pendingStatus: Status = await this.statusService.findStatusByName('Pending review');
    let acceptedStatus: Status = await this.statusService.findStatusByName('Accepted');

    let statusIDs: number[] = [pendingStatus.ID, acceptedStatus.ID];

    let qb = this.resumeRepository.createQueryBuilder('resume');
    qb.leftJoin('resume.contracts', 'contracts');
    qb.leftJoin('contracts.status', 'status');
    qb.andWhere('status.ID IN (:...statusIDs)', {statusIDs: statusIDs});
    qb.andWhere('resume.ID IN (:...resumeIDs)', {resumeIDs: resumeIDs});

    if(getResumeDTO.excludeContract != null && getResumeDTO.excludeContract > 0){
      qb.andWhere('contracts.ID != :contractID', {contractID: getResumeDTO.excludeContract});
    }

    if(getResumeDTO.startDate != null && getResumeDTO.endDate != null){

      let startDateString: Date = new Date(getResumeDTO.startDate);
      let endDateString: Date = new Date(getResumeDTO.endDate);

      qb.andWhere(':startDate < contracts.endDate AND :endDate > contracts.startDate', {startDate: startDateString, endDate: endDateString})
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
