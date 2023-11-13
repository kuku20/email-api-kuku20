import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Decimal128,
} from 'typeorm';
import { StockUser } from './stock-user.entity'; // Update the import path

@Entity()
export class WatchList {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dateAdded: string;

  @Column({ type: 'double precision' })
  pctChangeAtAdded:number ;

  @Column({ type: 'double precision' })
  priceAtAdded: number;

  @Column({ nullable: true })
  spotline?: boolean;

  @Column()
  symbol: string;

  @ManyToOne(() => StockUser, (stockUser) => stockUser.watchlists)
  @JoinColumn({ name: 'stockUserId' }) // Specify the column name for the foreign key
  stockUserId: StockUser;
}
