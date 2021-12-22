import { getRepository, MigrationInterface, QueryRunner } from "typeorm";
import { RoleEntity } from "../entities/role.entity";
import { ContractStatusSeed, RoleSeed, UserStatusSeed } from "./seeds/seeds";
import { UserStatusEntity } from "../entities/user-status.entity";
import { ContractStatusEntity } from "../entities/contract-status.entity";

export class initialData1637752289945 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await getRepository(RoleEntity).save(RoleSeed);
        await getRepository(UserStatusEntity).save(UserStatusSeed);
        await getRepository(ContractStatusEntity).save(ContractStatusSeed);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
