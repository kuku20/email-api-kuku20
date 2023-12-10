import { Exclude, Expose } from 'class-transformer';

export class SearchSymbolOutFMPDto {
  @Expose()
  symbol: string;
  @Expose()
  name: string;
  @Exclude()
  currency: string;
  @Exclude()
  stockExchange: string;
  @Exclude()
  exchangeShortName: string;
}
