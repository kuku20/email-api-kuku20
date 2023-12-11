import { Exclude, Expose, Transform } from 'class-transformer';

export class UserListOutDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'userId' })
  @Transform(({ value }) => (value ? value.id : null))
  userId;

  @Expose({ name: 'listTickers' })
  listTickers: string[];

  @Expose({ name: 'watchlists' })
  watchlists: [];

  @Expose({name:'maxLists'})
  maxLists: number;
}
