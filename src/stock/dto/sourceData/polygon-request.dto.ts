import { IsEnum } from 'class-validator';

export enum PolygonRType {
  BYDAY = 'byday',
  TYPEAHEAD = 'typeahead',
  DIVIDEND = 'dividends',
  OPENCLOSE = 'open-close',
  RANGEDAY = 'range-date',
}
export class PolygonDto {
  @IsEnum(PolygonRType)
  type: PolygonRType;
}
