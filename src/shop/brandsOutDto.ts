import {Expose} from 'class-transformer'

export class BrandsDto {
    @Expose({ name: 'Id' })
    id: number;
  
    @Expose({ name: 'Name' })
    name: string;
    
}