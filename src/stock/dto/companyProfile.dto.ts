import { Exclude, Expose, Transform } from 'class-transformer';

export class CompanyProfileDto {
  @Expose({ name: 'ticker' })
  symbol: string;
  @Expose()
  logo: string
  @Expose({ name: 'marketCapitalization' })
  @Transform(({ value }) => value * 1000000)
  marketCap: number;
  @Expose()
  name: string
  @Exclude()
  country: string
  @Exclude()
  currency: string
  @Exclude()
  estimateCurrency: string
  @Exclude()
  exchange: string
  @Exclude()
  finnhubIndustry: string
  @Exclude()
  ipo: string
  @Exclude()
  phone: string
  @Expose()
  shareOutstanding: number
  @Exclude()
  weburl: string
}
