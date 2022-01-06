import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { RoleEntity } from "./role.entity";
import { PasswordTokenEntity } from "./password-token.entity";
import { UserStatusEntity } from "./user-status.entity";
import { ConfirmationTokenEntity } from "./confirmation-token.entity";
import { CommentEntity } from "./comment.entity";

@Entity()
export class UserEntity {

  @PrimaryGeneratedColumn()
  public ID: number;

  @Column({unique: true})
  public username: string;

  @Column()
  public password: string;

  @Column()
  public salt: string;

  @Index()
  @ManyToOne(() => UserStatusEntity, (userStatusEntity: UserStatusEntity) => userStatusEntity.users)
  public status: UserStatusEntity;

  @Index()
  @ManyToOne(() => RoleEntity, (roleEntity: RoleEntity) => roleEntity.users)
  public role: RoleEntity;

  @OneToOne(() => PasswordTokenEntity,{cascade: true})
  public passwordToken?: PasswordTokenEntity

  @OneToOne(() => ConfirmationTokenEntity,{cascade: true})
  public confirmationToken?: ConfirmationTokenEntity

  @OneToMany(() => CommentEntity, (commentEntity: CommentEntity) => commentEntity.user, {cascade: true})
  public comments?: CommentEntity[]

}


