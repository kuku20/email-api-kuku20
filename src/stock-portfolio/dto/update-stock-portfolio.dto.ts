import { PartialType } from '@nestjs/mapped-types';
import { CreateStockPortfolioDto } from './create-stock-portfolio.dto';

export class UpdateStockPortfolioDto extends PartialType(CreateStockPortfolioDto) {}
