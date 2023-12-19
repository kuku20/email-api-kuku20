import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockPortfolio } from './index'; 

@Entity()
export class HoldingAmounts {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  symbol: string;

  @Column()
  date: string;

  @Column({ type: 'double precision' })
  amount: number;

  @Column({ type: 'double precision' })
  matchPrice: number;

  @Column({ type: 'double precision',nullable: true })
  atPctChange?: number;

  @Column({ type: 'double precision' })
  marketCap: number;

  @ManyToOne(() => StockPortfolio, (sPortfolio) => sPortfolio.holding_amounts)
  @JoinColumn({ name: 'sPortfolioId' }) // Specify the column name for the foreign key
  sPortfolioId: StockPortfolio;
}
