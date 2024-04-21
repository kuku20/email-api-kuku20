// user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class UserAuth {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  password: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  displayName?: string;
  
  @Column({ nullable: true })
  memberShips?: boolean;

  @Column()
  isAdmin?: boolean;

}
