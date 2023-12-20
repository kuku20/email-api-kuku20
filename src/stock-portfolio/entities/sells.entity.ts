import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockPortfolio } from './index'; 

@Entity()
export class Sell {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: string;

  @Column()
  symbol: string;

  @Column({ type: 'double precision' })
  amount: number;

  @Column({ type: 'double precision' })
  matchPrice: number;

  @Column({ type: 'double precision',nullable: true })
  atPctChange?: number;

  @Column({ type: 'double precision',nullable: true })
  atSellPctChange?: number;

  @Column({ type: 'double precision',nullable: true })
  netvalue?: number;

  @Column({ type: 'double precision',nullable: true })
  avaragePriceB?: number;

  @Column({ type: 'double precision',nullable: true })
  netProfit?: number;

  @Column({ type: 'double precision' })
  marketCap: number;

  @ManyToOne(() => StockPortfolio, (sPortfolio) => sPortfolio.sells)
  @JoinColumn({ name: 'sPortfolioId' }) // Specify the column name for the foreign key
  sPortfolioId: StockPortfolio;
}
