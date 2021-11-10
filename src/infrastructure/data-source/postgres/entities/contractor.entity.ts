import {
  AfterLoad,
  Column,
  Entity,
  Index,
  JoinColumn, JoinTable, ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn
} from "typeorm";
import { UserEntity } from "./user.entity";
import { RoleEntity } from "./role.entity";
import { ContractEntity } from "./contract.entity";

@Entity()
export class ContractorEntity {

  @PrimaryColumn({})
  public ID: number;

  @ManyToMany(() => ContractEntity, contractEntity => contractEntity.contractors)
  @JoinTable()
  contracts: ContractEntity[];
}
