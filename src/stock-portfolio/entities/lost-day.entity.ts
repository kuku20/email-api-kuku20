import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockPortfolio } from './stock-portfolio.entity';

@Entity()
export class LostDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: string;

  @Column()
  symbol: string;

  @Column({ type: 'double precision' })
  matchPrice: number;

  @Column({ type: 'double precision', nullable: true })
  atPctChange?: number;

  @Column({ type: 'double precision', nullable: true })
  marketCap: number;

  @ManyToOne(() => StockPortfolio, (sPortfolio) => sPortfolio.lostday)
  @JoinColumn({ name: 'sPortfolioId' }) // Column name in DB
  sPortfolioId: StockPortfolio;
}
