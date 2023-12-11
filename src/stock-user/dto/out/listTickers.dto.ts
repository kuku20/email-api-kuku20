import { Exclude, Expose, Transform } from 'class-transformer';

export class ListTickersDto {
  @Exclude()
  @Expose({ name: 'id' })
  id: string;

  @Exclude()
  @Expose({ name: 'watchlists' })
  watchlists: [];

  @Expose({ name: 'listTickers' })
  listTickers: string[];
}
