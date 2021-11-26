import { Body, Controller, Get, HttpException, HttpStatus, Inject, Post, Query } from "@nestjs/common";
import { GetResumesDTO } from "../dtos/get.resumes.dto";
import { IContractService, IContractServiceProvider } from "../../core/primary-ports/contract.service.interface";
import { IResumeService, IResumeServiceProvider } from "../../core/primary-ports/resume.service.interface";
import { Contract } from "../../core/models/contract";
import { Resume } from "../../core/models/resume";
import { FilterList } from "../../core/models/filterList";

@Controller('resume')
export class ResumeController {

  constructor(@Inject(IResumeServiceProvider) private resumeService: IResumeService) {}

  //@Roles('Admin')
  //@UseGuards(JwtAuthGuard)
  @Post('getResumes')
  async getResumes(@Body() getResumeDTO: GetResumesDTO){
    try {
      let resumeFiler: FilterList<Resume> = await this.resumeService.getResumes(getResumeDTO);
      return resumeFiler;
    }
    catch (e) {console.log(e);
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  //@Roles('Admin')
  //@UseGuards(JwtAuthGuard)
  @Get('getResumeByID')
  async getResumeByID(@Query() resumeID: any){
    try {
      return await this.resumeService.getResumeByID(resumeID.ID, false);
    }
    catch (e) {
        throw new HttpException(e.message, HttpStatus.NOT_FOUND);
      }
  }

  //@UseGuards(JwtAuthGuard)
  @Get('getResumeByIDUser')
  async getResumeByIDUser(@Query() resumeID: any){
    return await this.resumeService.getResumeByID(resumeID.ID, true);
  }

}
