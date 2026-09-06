import { Expose, Transform } from 'class-transformer';

const TIME_ZONE = 'America/Chicago';

export class ChartOutTiingo {
  @Expose({ name: 'ticker' })
  ticker: string;

  @Expose({ name: 'open' })
  open: number;

  @Expose({ name: 'close' })
  close: number;

  @Expose({ name: 'low' })
  low: number;

  @Expose({ name: 'high' })
  high: number;
  
  @Expose({ name: 'volume' })
  @Transform(({ value }) => (value ? Number(value) : 0))
  volume: number;
  
  @Expose({ name: 'date' })
  @Transform(({ value }) => {
    if (!value) return null;

    const date = new Date(value);

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);

    const get = (type: string) =>
      parts.find(part => part.type === type)?.value ?? '';

    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
  })
  date: string;
}