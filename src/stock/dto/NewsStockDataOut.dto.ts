import { Exclude, Expose } from 'class-transformer';

export class NewsStockDataOut {
  @Expose()
  title: string

  @Expose()
  url: string

  @Expose({name:'description'})
  summary: string

  @Expose({name:'published_at'})
  time_published: string

  @Expose()
  source: string

  @Expose()
  relevance_score: any
  @Exclude()
  keywords: string
  @Exclude()
  snippet: string
  @Exclude()
  image_url: string
  @Exclude()
  language: string
  @Exclude()
  entities: Array<any>
  @Exclude()
  similar: Array<any>
  @Exclude()
  uuid: string
}
