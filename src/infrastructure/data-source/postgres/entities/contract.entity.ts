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

export enum contractStatus {
  PLANNING = "planning",
  ACTIVE = "active",
  COMPLETED = "completed"
}

@Entity()
export class ContractEntity {

  @PrimaryGeneratedColumn()
  public ID: number;

  @Column()
  public title: string;

  @Column({ type: "enum", enum: contractStatus, default: contractStatus.PLANNING })
  public status: string;

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
