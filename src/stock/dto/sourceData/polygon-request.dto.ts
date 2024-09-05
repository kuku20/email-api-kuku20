import { IsEnum } from 'class-validator';

export enum PolygonRType {
  BYDAY = 'byday',
  TYPEAHEAD = 'typeahead',
  DIVIDEND = 'dividends',
  OPENCLOSE = 'open-close',
}
export class PolygonDto {
  @IsEnum(PolygonRType)
  type: PolygonRType;
}
