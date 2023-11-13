import { Exclude, Expose, Transform } from 'class-transformer';

export class UserListOutDto {
  @Expose({ name: 'id' })
  id: string;

  @Expose({ name: 'listTickers' })
  listTickers: string[];

  @Exclude()
  userId;
}
