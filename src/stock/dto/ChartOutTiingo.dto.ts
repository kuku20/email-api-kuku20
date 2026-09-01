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

  @Expose({ name: 'date' })
  @Transform(({ value }) => {
    if (!value) return null;

    const date = new Date(value);

    return date
      .toLocaleString('en-CA', {
        timeZone: TIME_ZONE,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      .replace(',', '');
  })
  date: string;
}


// (EST/EDT)
// @Transform(({ value }) => {
//   if (!value) return null;

//   // Parse the date and convert to Eastern Time
//   const date = new Date(value);
//   return date
//     .toLocaleString('en-CA', {
//       hour12: false,
//       timeZone: 'America/New_York', // forces EST/EDT
//     })
//     .replace(',', '');
// })
// date: string;