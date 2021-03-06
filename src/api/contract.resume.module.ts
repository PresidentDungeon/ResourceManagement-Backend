import { Module } from "@nestjs/common";
import { ContractController } from "./controllers/contract.controller";
import { ContractService } from "../core/services/contract.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContractEntity } from "../infrastructure/data-source/postgres/entities/contract.entity";
import { ResumeEntity } from "../infrastructure/data-source/postgres/entities/resume.entity";
import { ContractStatusEntity } from "../infrastructure/data-source/postgres/entities/contract-status.entity";
import { ContractStatusService } from "../core/services/contract-status.service";
import { ResumeController } from "./controllers/resume.controller";
import { ResumeService } from "../core/services/resume.service";
import { HttpModule } from "@nestjs/axios";
import { IResumeServiceProvider } from "../core/primary-ports/application-services/resume.service.interface";
import { IContractStatusServiceProvider } from "../core/primary-ports/application-services/contract-status.service.interface";
import { IContractServiceProvider } from "../core/primary-ports/application-services/contract.service.interface";
import { ResumeRequestEntity } from "../infrastructure/data-source/postgres/entities/resume-request.entity";
import { SocketModule } from "./socket.module";
import { CommentEntity } from "src/infrastructure/data-source/postgres/entities/comment.entity";

import { WhitelistModule } from './whitelist.module';
import { WhitelistController } from './controllers/whitelist.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ContractEntity, ResumeEntity, ContractStatusEntity, ResumeRequestEntity, CommentEntity]),
    HttpModule, SocketModule, WhitelistModule],
  controllers: [ContractController, ResumeController, WhitelistController],
  providers: [
    { provide: IContractServiceProvider, useClass: ContractService },
    { provide: IContractStatusServiceProvider, useClass: ContractStatusService },
    { provide: IResumeServiceProvider, useClass: ResumeService
  }],
  exports: [IContractServiceProvider, IContractStatusServiceProvider, IResumeServiceProvider]
})
export class ContractResumeModule {
}


