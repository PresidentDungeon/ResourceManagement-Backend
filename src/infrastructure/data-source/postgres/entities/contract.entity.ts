import { Column, Entity, Index, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";
import { ResumeEntity } from "./resume.entity";
import { ContractStatusEntity } from "./contract-status.entity";
import { ResumeRequestEntity } from "./resume-request.entity";
import { CommentEntity } from "./comment.entity";
import { WhitelistDomainEntity } from "./whitelist.domain.entity";

@Entity()
export class ContractEntity {

  @PrimaryGeneratedColumn()
  public ID: number;

  @Column()
  public title: string;

  @Column()
  public description: string;

  @Column({default: false})
  public isVisibleToDomainUsers: boolean;

  @Index()
  @ManyToOne(() => ContractStatusEntity, (contractStatusEntity: ContractStatusEntity) => contractStatusEntity.contracts)
  public status: ContractStatusEntity;

  @Column({ type: 'timestamptz'})
  startDate: Date;

  @Column({ type: 'timestamptz'})
  endDate: Date;

  @Column({ type: 'timestamp', nullable: true})
  dueDate?: Date;

  @OneToMany(() => ResumeRequestEntity, (resumeRequestEntity: ResumeRequestEntity) => resumeRequestEntity.contract, {cascade: true})
  resumeRequests: ResumeRequestEntity[];

  @OneToMany(() => CommentEntity, (commentEntity: CommentEntity) => commentEntity.contract, {cascade: true})
  comments: CommentEntity[]

  @ManyToMany(() => UserEntity)
  @JoinTable()
  users: UserEntity[];

  @ManyToMany(() => ResumeEntity, contractorEntity => contractorEntity.contracts, {cascade: ['insert']})
  @JoinTable()
  resumes: ResumeEntity[];

  @ManyToMany(() => WhitelistDomainEntity, whitelistDomain => whitelistDomain.contracts, {cascade: ['remove']})
  @JoinTable()
  whitelists: WhitelistDomainEntity[];
}
