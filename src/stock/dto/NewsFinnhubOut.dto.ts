import { Exclude, Expose } from 'class-transformer';

export class NewsFinnhubOutDto {
  @Expose({ name: 'headline' })
  title: string;

  @Expose()
  url: string;

  @Expose()
  summary: string;

  @Expose({name:'datetime'})
  time_published: number;

  @Expose()
  source: string;


  @Exclude()
  category: string;
  @Exclude()
  id: number;
  @Exclude()
  image: string;
  @Exclude()
  related: string;
  
  
  
}
