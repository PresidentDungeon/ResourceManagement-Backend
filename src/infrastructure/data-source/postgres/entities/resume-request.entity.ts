import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ContractEntity } from "./contract.entity";

@Entity()
export class ResumeRequestEntity {

  @PrimaryGeneratedColumn()
  public ID: number;

  @Column()
  public occupation: string;

  @Column()
  public count: number;

  @Index()
  @ManyToOne(() => ContractEntity, (contractEntity: ContractEntity) => contractEntity.resumeRequests, {onDelete: "CASCADE"})
  public contract: ContractEntity
}


