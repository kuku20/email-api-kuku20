import { Exclude, Expose, Transform } from 'class-transformer';

export class ListOutDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'dateAdded' })
  dateAdded: string;

  @Expose()
  pctChangeAtAdded:any

  @Expose()
  priceAtAdded:any

  @Expose()
  spotline:any

  @Expose()
  symbol:any

  @Exclude()
  stockUserId:any
}
