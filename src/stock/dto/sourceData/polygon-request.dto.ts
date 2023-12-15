import { IsEnum } from 'class-validator';

export enum PolygonRType {
  BYDAY = 'byday',
  TYPEAHEAD = 'typeahead',
  DIVIDEND = 'dividends',
}
export class PolygonDto {
  @IsEnum(PolygonRType)
  type: PolygonRType;
}
