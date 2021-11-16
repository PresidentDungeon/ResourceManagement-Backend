import { Module } from '@nestjs/common';
import { ContractController } from "./controllers/contract.controller";
import { ContractService } from "../core/services/contract.service";
import { IContractServiceProvider } from "../core/primary-ports/contract.service.interface";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContractEntity } from "../infrastructure/data-source/postgres/entities/contract.entity";
import { ContractorEntity } from "../infrastructure/data-source/postgres/entities/contractor.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ContractEntity, ContractorEntity])],
  controllers: [ContractController],
  providers: [{provide: IContractServiceProvider, useClass: ContractService}],
  exports: [IContractServiceProvider]
})
export class ContractModule {}


