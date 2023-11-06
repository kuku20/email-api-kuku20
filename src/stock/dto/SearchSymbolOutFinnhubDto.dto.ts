import { Exclude, Expose } from 'class-transformer';

export class SearchSymbolOutFinnhubDto {
  @Expose()
  symbol: string;
  @Expose({ name: 'description' })
  name: string;
  @Exclude()
  displaySymbol: string;
  @Exclude()
  type: string;
}
