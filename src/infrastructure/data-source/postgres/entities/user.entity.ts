import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { RoleEntity } from "./role.entity";
import { PasswordTokenEntity } from "./password-token.entity";

  export enum UserStatus {
    PENDING = "pending",
    ACTIVE = "active"
  }

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

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.PENDING
  })
  public status: string;

  @Column()
  public verificationCode: string;

  @Index()
  @ManyToOne(() => RoleEntity, (roleEntity: RoleEntity) => roleEntity.users)
  public role: RoleEntity;

  @OneToOne(() => PasswordTokenEntity,{cascade: true})
  public passwordToken?: PasswordTokenEntity

}
