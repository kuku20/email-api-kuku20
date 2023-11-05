import { Expose } from 'class-transformer';

export class BulkRequestsDto {
  @Expose({ name: 'changesPercentage' })
  pctChange: number;
  @Expose({ name: 'earningsAnnouncement' })
  earnAnn: string

  symbol: string
  name: string
  price: number
  change: number
  dayLow: number
  dayHigh: number
  yearHigh: number
  yearLow: number
  marketCap: number
  priceAvg50: number
  priceAvg200: number
  exchange: string
  volume: number
  avgVolume: number
  open: number
  previousClose: number
  eps: number
  pe: number
  sharesOutstanding: number
  timestamp: number
}
