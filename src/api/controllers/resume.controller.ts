import { Body, Controller, Get, Inject, Post, Query, UseGuards, UseInterceptors } from "@nestjs/common";
import { GetResumesDTO } from "../dtos/get.resumes.dto";
import { IResumeService, IResumeServiceProvider } from "../../core/primary-ports/application-services/resume.service.interface";
import { Resume } from "../../core/models/resume";
import { FilterList } from "../../core/models/filterList";
import { Roles } from "../security/roles.decorator";
import { JwtAuthGuard } from "../security/jwt-auth-guard";
import { ErrorInterceptor } from "../error-handling/error-interceptor";

@Controller('resume')
@UseInterceptors(ErrorInterceptor)
export class ResumeController {
  constructor(@Inject(IResumeServiceProvider) private resumeService: IResumeService) {}

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Post('getResumes')
  async getResumes(@Body() getResumeDTO: GetResumesDTO){
    let resumeFiler: FilterList<Resume> = await this.resumeService.getResumes(getResumeDTO);
    return resumeFiler;
  }

  @Roles('Admin')
  @UseGuards(JwtAuthGuard)
  @Get('getResumeByID')
  async getResumeByID(@Query() resumeID: any){
    return await this.resumeService.getResumeByID(resumeID.ID, false);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getResumeByIDUser')
  async getResumeByIDUser(@Query() resumeID: any){
    return await this.resumeService.getResumeByID(resumeID.ID, true);
  }

}
