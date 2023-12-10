import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Buy, Sell, Withdraw, Deposit, HoldingAmounts } from './index';
import { UserAuth } from 'src/auth/userAuth.entity';

@Entity()
export class StockPortfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => UserAuth)
  @JoinColumn()
  userId: UserAuth;

  @OneToMany(() => Deposit, (deposits) => deposits.sPortfolioId, {
    cascade: true,
  })
  deposits: Deposit[];

  @OneToMany(() => Withdraw, (withdraws) => withdraws.sPortfolioId, {
    cascade: true,
  })
  withdraws: Withdraw[];

  @Column({ nullable: true, type: 'double precision' })
  balance?: number;

  @OneToMany(() => Buy, (buys) => buys.sPortfolioId, {
    cascade: true,
  })
  buys: Buy[];

  @OneToMany(() => Sell, (sells) => sells.sPortfolioId, {
    cascade: true,
  })
  sells: Sell[];

  @OneToMany(() => HoldingAmounts, (holds) => holds.sPortfolioId, {
    cascade: true,
  })
  holding_amounts: HoldingAmounts[];
}
