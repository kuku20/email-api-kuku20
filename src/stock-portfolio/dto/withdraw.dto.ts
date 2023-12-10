import { IsUUID, IsNumber, IsString } from 'class-validator';
export class WithdrawDto {
  @IsUUID()
  id: string;

  @IsString()
  dateWithdraw: string;

  @IsString()
  method?: string;

  @IsString()
  status?: string;

  @IsNumber()
  amount: number;

  @IsUUID()
  sPortfolioId: string;
}
