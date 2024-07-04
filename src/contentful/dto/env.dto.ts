import { IsEnum } from 'class-validator';

export enum CONTENTFULTYPE {
  DEV = 'dev',
  PROD = 'prod',
  MASTER = 'master',
}
export class ContentfulDto {
  @IsEnum(CONTENTFULTYPE)
  env: CONTENTFULTYPE;
}
