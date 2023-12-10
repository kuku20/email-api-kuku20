import {Injectable,NotAcceptableException,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, QueryFailedError, Repository } from 'typeorm';
import { Buy, Sell, Withdraw, Deposit, HoldingAmounts ,StockPortfolio} from './entities/index';
import {BuyDto,DepositDto,
  HoldingAmountsDto,SellDto,WithdrawDto,UserDto,
  CreateStockPortfolioDto,UpdateStockPortfolioDto
} from './dto/index';

import { WalletOutPutDto } from './dto/out/index';
import { UserAuth } from 'src/auth/userAuth.entity';
import { plainToInstance } from 'class-transformer';
@Injectable()
export class StockPortfolioService {
  constructor(
    @InjectRepository(StockPortfolio)
    private PortfolioRepo: Repository<StockPortfolio>,
    @InjectRepository(HoldingAmounts)
    private HoldingRepo: Repository<HoldingAmounts>,
    @InjectRepository(Deposit)
    private DepositRepo: Repository<Deposit>,
    @InjectRepository(Withdraw)
    private WithdrawRepo: Repository<Withdraw>,
    @InjectRepository(Sell)
    private SellRepo: Repository<Sell>,
    @InjectRepository(Buy)
    private BuyRepo: Repository<Buy>,
    @InjectRepository(UserAuth)
    private userRepo: Repository<UserAuth>,
  ){}

  async createPortfolio(
    createPortfolio: CreateStockPortfolioDto,
  ): Promise<StockPortfolio> {
    try {
      const user = await this.userRepo.findOneOrFail({
        where: { id: createPortfolio.id },
      });

      // Create the PortfolioRepo entity
      const stockUser = this.PortfolioRepo.create({
        userId: user,
        balance:0
      });

      // Save the StockUser entity to the database
      const result = await this.PortfolioRepo.save(stockUser);
      return result
      // return plainToInstance(WalletOutPutDto, result);
    } catch (error) {
      if (error instanceof EntityNotFoundError) {
        // Handle not found exception as needed
        throw new NotFoundException(
          `This user id ${createPortfolio.id} has list-stock`,
        );
      }else if (error instanceof QueryFailedError) {
        // Handle query execution error
        throw new NotAcceptableException('You cannot have more than 1 user-list');
      }
      // Handle other errors or rethrow
      throw error;
    }
  }

  async findAllPortfolios() {
    const PortfolioRepo = await this.PortfolioRepo.find({
      // relations: ['userId', 'watchlists'], // Load the associated userId
      relations: ['userId','deposits','withdraws','buys','sells','holding_amounts'], // Load the associated userId
    });
    // return PortfolioRepo;
    return plainToInstance(WalletOutPutDto, PortfolioRepo);
  }
  create(createStockPortfolioDto: CreateStockPortfolioDto) {
    return 'This action adds a new stockPortfolio';
  }

  findAll() {
    return `This action returns all stockPortfolio`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stockPortfolio`;
  }

  update(id: number, updateStockPortfolioDto: UpdateStockPortfolioDto) {
    return `This action updates a #${id} stockPortfolio`;
  }

  remove(id: number) {
    return `This action removes a #${id} stockPortfolio`;
  }
}
