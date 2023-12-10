import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockPortfolio } from './index'; 

@Entity()
export class Buy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dateBuy: string;

  @Column()
  symbol: string;

  @Column({ type: 'double precision' })
  amount: number;

  @Column({ type: 'double precision' })
  matchPrice: number;

  @Column({ type: 'double precision' })
  marketCap: number;

  @ManyToOne(() => StockPortfolio, (sPortfolio) => sPortfolio.buys)
  @JoinColumn({ name: 'sPortfolioId' }) // Specify the column name for the foreign key
  sPortfolioId: StockPortfolio;
}
