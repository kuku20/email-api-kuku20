import {Expose} from 'class-transformer'

export class TypesDto {
    @Expose({ name: 'Id' })
    id: number;
  
    @Expose({ name: 'Name' })
    name: string;
}