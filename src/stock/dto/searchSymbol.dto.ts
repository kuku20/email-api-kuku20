import { Exclude, Expose } from 'class-transformer';

export class SearchSymbolOutPolygonDto {
  @Expose({ name: 'ticker' })
  symbol: string;
  @Expose()
  name: string;
  @Exclude()
  market: string;
  @Exclude()
  locale: string;
  @Exclude()
  primary_exchange?: string;
  @Exclude()
  type?: string;
  @Exclude()
  active: boolean;
  @Exclude()
  currency_name?: string;
  @Exclude()
  cik?: string;
  @Exclude()
  composite_figi?: string;
  @Exclude()
  share_class_figi?: string;
  @Exclude()
  last_updated_utc?: string;
  @Exclude()
  source_feed?: string;
}
