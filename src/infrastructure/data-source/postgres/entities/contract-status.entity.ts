import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ContractEntity } from "./contract.entity";

@Entity()
export class ContractStatusEntity {

  @PrimaryGeneratedColumn()
  public ID: number;

  @Column({ unique: true })
  public status: string;

  @OneToMany(() => ContractEntity, (contract: ContractEntity) => contract.status)
  public contracts?: ContractEntity[];
}
