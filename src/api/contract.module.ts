import { Module } from '@nestjs/common';
import { ContractController } from "./controllers/contract.controller";
import { ContractService } from "../core/services/contract.service";
import { IContractServiceProvider } from "../core/primary-ports/contract.service.interface";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContractEntity } from "../infrastructure/data-source/postgres/entities/contract.entity";
import { ResumeEntity } from "../infrastructure/data-source/postgres/entities/resume.entity";
import { ContractStatusEntity } from "../infrastructure/data-source/postgres/entities/contract-status.entity";
import { IContractStatusServiceProvider } from "../core/primary-ports/contract-status.service.interface";
import { ContractStatusService } from "../core/services/contract-status.service";

@Module({
  imports: [TypeOrmModule.forFeature([ContractEntity, ResumeEntity, ContractStatusEntity])],
  controllers: [ContractController],
  providers: [{provide: IContractServiceProvider, useClass: ContractService}, {provide: IContractStatusServiceProvider, useClass: ContractStatusService}],
  exports: [IContractServiceProvider]
})
export class ContractModule {}


