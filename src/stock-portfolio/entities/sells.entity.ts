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
  dateSell: string;

  @Column()
  symbol: string;

  @Column({ type: 'double precision' })
  amount: number;

  @Column({ type: 'double precision' })
  matchPrice: number;

  @Column({ type: 'double precision' })
  marketCap: number;

  @ManyToOne(() => StockPortfolio, (sPortfolio) => sPortfolio.sells)
  @JoinColumn({ name: 'sPortfolioId' }) // Specify the column name for the foreign key
  sPortfolioId: StockPortfolio;
}
