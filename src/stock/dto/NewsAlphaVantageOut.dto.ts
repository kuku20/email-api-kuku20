import { Exclude, Expose } from 'class-transformer';

export class NewsAlphaVantageOutDto {
  @Expose()
  title: string;

  @Expose()
  url: string;

  @Expose()
  summary: string;

  @Expose()
  time_published: string;

  @Expose()
  source: string;
  
  @Expose()
  overall_sentiment_score: number;
  @Expose()
  overall_sentiment_label: string;

  @Exclude()
  banner_image?: string;
  @Exclude()
  category_within_source: string;
  @Exclude()
  source_domain: string;
  @Exclude()
  topics: Array<{
    topic: string;
    relevance_score: string;
  }>;
  @Exclude()
  authors: Array<string>;
  @Exclude()
  ticker_sentiment: Array<{
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }>;
}
