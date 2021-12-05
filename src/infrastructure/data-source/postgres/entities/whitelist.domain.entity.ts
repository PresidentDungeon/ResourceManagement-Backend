import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { ContractEntity } from "./contract.entity";

@Entity()
export class WhitelistDomainEntity {

  @PrimaryGeneratedColumn()
  public ID: number;

  @Column({ unique: true })
  public domain: string;

  @ManyToMany(() => ContractEntity, contractEntity => contractEntity.whitelists, {onDelete: 'CASCADE'})
  contracts: ContractEntity[];
}
