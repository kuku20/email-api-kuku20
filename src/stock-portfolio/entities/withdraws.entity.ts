import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StockPortfolio } from './index'; // Update the import path

@Entity()
export class Withdraw {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: string;

  @Column({ nullable: true })
  method?: string;

  @Column({ nullable: true })
  status?: string;
  
  @Column({ type: 'double precision' })
  amount: number;

  @ManyToOne(() => StockPortfolio, (sPortfolio) => sPortfolio.withdraws)
  @JoinColumn({ name: 'sPortfolioId' }) // Specify the column name for the foreign key
  sPortfolioId: StockPortfolio;
}
