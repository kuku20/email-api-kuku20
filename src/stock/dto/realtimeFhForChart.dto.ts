import { Expose , Exclude, Transform} from 'class-transformer';

export class RealTimePriceFhForChartDto {
  @Expose({ name: 'c' })
  close: number;

  // @Expose({ name: 'd' })
  // change: number;
  @Exclude()
  d:number

  // @Expose({ name: 'dp' })
  // pctChange: number;
  @Exclude()
  dp:number

  @Expose({ name: 'h' })
  high: number;
  @Expose({ name: 'l' })
  low: number;
  @Expose({ name: 'o' })
  open: number;

  // @Expose({ name: 'pc' })
  // previousClose: number;
  @Exclude()
  pc:number

  @Expose({ name: 't' })
  @Transform(({ value }) => {
    if (!value) return null;
  
    let date = new Date(value * 1000);  // Convert from seconds to milliseconds
    date.setHours(date.getHours() + 1);  // Add one hour to the time
  
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Months are zero-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  })
  date: string;
}