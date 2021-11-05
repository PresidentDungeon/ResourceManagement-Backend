import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity()
export class StatusEntity {

  @PrimaryGeneratedColumn()
  public ID: number;

  @Column({
    unique: true
  })
  public status: string;

  @OneToMany(() => UserEntity, (user: UserEntity) => user.status)
  public users?: UserEntity[];
}
