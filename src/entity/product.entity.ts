import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductType } from './productTypes.entity';
import { ProductBrand } from './ProductBrands.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  Id: number;
  @Column()
  Name: string;
  @Column()
  Description: string;
  @Column()
  Price: number;
  @Column()
  PictureUrl: string;
  @Column()
  ProductTypeId: string;
  @Column()
  ProductBrandId: string;

  @ManyToOne(() => ProductType)
  @JoinColumn({ name: 'ProductTypeId' })
  ProductType: ProductType;

  @ManyToOne(() => ProductBrand)
  @JoinColumn({ name: 'ProductBrandId' })
  ProductBrand: ProductBrand;
  
}
