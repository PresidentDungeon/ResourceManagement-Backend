import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { ContractEntity } from "./contract.entity";
import { UserEntity } from "./user.entity";

@Entity()
export class CommentEntity {

  @Column()
  public comment: string;

  @Index()
  @ManyToOne(() => ContractEntity, (contractEntity: ContractEntity) => contractEntity.comments, {primary: true, onDelete: "CASCADE"})
  public contract: ContractEntity;

  @Index()
  @ManyToOne(() => UserEntity, (userEntity: UserEntity) => userEntity.comments, {primary: true, onDelete: "CASCADE"})
  public user: UserEntity;
}
