import { IsUUID, IsNumber, IsString } from 'class-validator';
export class DepositDto {
  @IsUUID()
  id: string;

  @IsString()
  dateDeposit: string;

  @IsString()
  method?: string;

  @IsString()
  status?: string;

  @IsNumber()
  amount: number;

  @IsUUID()
  sPortfolioId: string;
}
