import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity()
export class ConfirmationTokenEntity {

  @OneToOne(() => UserEntity, {primary: true})
  @JoinColumn()
  public user: UserEntity;

  @Column()
  public salt: string;

  @Column()
  public hashedConfirmationToken: string;
}
