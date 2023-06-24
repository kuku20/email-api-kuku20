import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  Id: number;
  @Column()
  Name:string;
  @Column()
  Description:string;
  @Column()
  Price:number;
  @Column()
  PictureUrl:string;
  @Column()
  ProductType:string;
  @Column()
  ProductBrand:string;
}