import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from "typeorm";
import { UserEntity } from "./user.entity";
import { ResumeEntity } from "./resume.entity";
import { UserStatusEntity } from "./user-status.entity";
import { ContractStatusEntity } from "./contract-status.entity";

@Entity()
export class ContractEntity {

  @PrimaryGeneratedColumn()
  public ID: number;

  @Column()
  public title: string;

  @Index()
  @ManyToOne(() => ContractStatusEntity, (contractStatusEntity: ContractStatusEntity) => contractStatusEntity.contracts)
  public status: ContractStatusEntity;

  @Column({ type: 'timestamptz'})
  startDate: Date;

  @Column({ type: 'timestamptz'})
  endDate: Date;

  @ManyToMany(() => UserEntity)
  @JoinTable()
  users: UserEntity[];

  @ManyToMany(() => ResumeEntity, contractorEntity => contractorEntity.contracts, {cascade: ['insert']})
  @JoinTable()
  resumes: ResumeEntity[];
}
