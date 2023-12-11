import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { WatchList } from './watchlist.entity'; // Update the import path
import { UserAuth } from 'src/auth/userAuth.entity';

@Entity()
export class StockUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('simple-array', { nullable: true })
  listTickers: string[];

  @Column({ nullable: true })
  maxLists: number;

  @OneToMany(() => WatchList, (watchList) => watchList.stockUserId, {
    cascade: true,
  })
  watchlists: WatchList[];

  @OneToOne(() => UserAuth)
  @JoinColumn()
  userId: UserAuth;
}
