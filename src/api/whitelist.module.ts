import { Module } from '@nestjs/common';
import { TypeOrmModule } from "@nestjs/typeorm";
import { WhitelistDomainEntity } from "../infrastructure/data-source/postgres/entities/whitelist.domain.entity";
import { IWhitelistServiceProvider } from "../core/primary-ports/application-services/whitelist.service.interface";
import { WhitelistService } from "../core/services/whitelist.service";
import { WhitelistController } from "./controllers/whitelist.controller";

@Module({
  imports: [TypeOrmModule.forFeature([WhitelistDomainEntity])],
  providers: [{provide: IWhitelistServiceProvider, useClass: WhitelistService},],
  controllers: [WhitelistController],
  exports: [IWhitelistServiceProvider]
})
export class WhitelistModule {}
