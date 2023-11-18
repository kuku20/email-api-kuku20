import { Exclude, Expose } from 'class-transformer';

export class NewsFinnhubOutDto {
  @Exclude()
  category: string;
  @Expose()
  datetime: number;
  @Expose({ name: 'headline' })
  title: string;
  @Exclude()
  id: number;
  @Exclude()
  image: string;
  @Exclude()
  related: string;
  @Expose()
  source: string;
  @Expose()
  summary: string;
  @Expose()
  url: string;
}
