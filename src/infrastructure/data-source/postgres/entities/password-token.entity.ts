import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity()
export class PasswordTokenEntity {

  @OneToOne(() => UserEntity, {primary: true})
  @JoinColumn()
  public user: UserEntity;

  @Column()
  public hashedResetToken: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP'})
  time?: Date;
}
