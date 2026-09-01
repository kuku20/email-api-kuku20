import { Exclude, Expose, Transform } from 'class-transformer';

export class ChartOutTwelveData {
  @Expose({ name: 'volume' })
  @Transform(({ value }) => (value ? Number(value) : 0))
  volume: number;

  @Expose({ name: 'open' })
  @Transform(({ value }) => (value ? Number(value) : 0))
  open: number;

  @Expose({ name: 'close' })
  @Transform(({ value }) => (value ? Number(value) : 0))
  close: number;

  @Expose({ name: 'low' })
  @Transform(({ value }) => (value ? Number(value) : 0))
  low: number;

  @Expose({ name: 'high' })
  @Transform(({ value }) => (value ? Number(value) : 0))
  high: number;

  @Expose({ name: 'datetime' })
  @Transform(({ value }) => {
    if (!value) return null;
    const date = new Date(value);
    return date.toLocaleString('en-CA', { hour12: false }).replace(',', '');
  })
  date: string;
}

const TIME_ZONE = 'America/New_York';

export class ChartOutTwelveDataUTC {
  @Expose({ name: 'volume' })
  @Transform(({ value }) => (value ? Number(value) : 0))
  volume: number;

  @Expose({ name: 'open' })
  @Transform(({ value }) => (value ? Number(value) : 0))
  open: number;

  @Expose({ name: 'close' })
  @Transform(({ value }) => (value ? Number(value) : 0))
  close: number;

  @Expose({ name: 'low' })
  @Transform(({ value }) => (value ? Number(value) : 0))
  low: number;

  @Expose({ name: 'high' })
  @Transform(({ value }) => (value ? Number(value) : 0))
  high: number;

  @Expose({ name: 'datetime' })
  @Transform(({ value }) => {
    if (!value) return null;

    // Twelve Data datetime is UTC.
    // Add Z only when the value does not already contain timezone information.
    const dateString =
      typeof value === 'string' && /Z|[+-]\d{2}:\d{2}$/.test(value)
        ? value
        : `${value}Z`;

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

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
      parts.find((part) => part.type === type)?.value ?? '';

    return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get(
      'minute',
    )}:${get('second')}`;
  })
  date: string;
}
