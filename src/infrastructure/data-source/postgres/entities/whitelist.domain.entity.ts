import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class WhitelistDomainEntity {

  @PrimaryGeneratedColumn()
  public ID: number;

  @Column({ unique: true })
  public domain: string;
}
