import { Exclude, Expose, Transform } from 'class-transformer';

export class ProductOutputDto {
  @Expose({ name: 'Id' })
  id: number;

  @Expose({ name: 'Name' })
  name: string;

  @Expose({ name: 'Description' })
  description: string;

  @Expose({ name: 'Price' })
  price: any;

  @Expose({ name: 'PictureUrl' })
  pictureUrl: string;

  @Expose({ name: 'ProductType' })
  @Transform(({ value }) => value ? value.Name : null)
  productType: string;

  @Expose({ name: 'ProductBrand' })
  @Transform(({ value }) => value ? value.Name : null)
  productBrand: string;
  
  @Exclude()
  ProductTypeId: string;

  @Exclude() 
  ProductBrandId: string;
}
