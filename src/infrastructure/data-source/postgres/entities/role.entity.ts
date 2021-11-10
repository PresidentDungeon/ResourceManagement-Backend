import { Column, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity()
export class RoleEntity {

  @PrimaryGeneratedColumn()
  public ID: number;

  @Column({
    unique: true
  })
  public role: string;

  @OneToMany(() => UserEntity, (user: UserEntity) => user.role)
  public users?: UserEntity[];
}
