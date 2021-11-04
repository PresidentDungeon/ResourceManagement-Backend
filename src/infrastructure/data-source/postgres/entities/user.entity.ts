import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { RoleEntity } from "./role.entity";
import { PasswordTokenEntity } from "./password-token.entity";
import { StatusEntity } from "./status.entity";

@Entity()
export class UserEntity {

  @PrimaryGeneratedColumn()
  public ID: number;

  @Column()
  public username: string;

  @Column()
  public password: string;

  @Column()
  public salt: string;

  @Column()
  public verificationCode: string;

  @Index()
  @ManyToOne(() => StatusEntity, (statusEntity: StatusEntity) => statusEntity.users)
  public status: StatusEntity;

  @Index()
  @ManyToOne(() => RoleEntity, (roleEntity: RoleEntity) => roleEntity.users)
  public role: RoleEntity;

  @OneToOne(() => PasswordTokenEntity,{cascade: true})
  public passwordToken?: PasswordTokenEntity

}
