import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { WatchList } from './watchlist.entity'; // Update the import path
import { User } from '../../user/user.entity';

@Entity()
export class StockUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('simple-array', { nullable: true })
  listTickers: string[];

  @OneToMany(() => WatchList, (watchList) => watchList.stockUserId, {
    cascade: true,
  })
  watchlists: WatchList[];

  @OneToOne(() => User)
  @JoinColumn()
  userId: User;
}
