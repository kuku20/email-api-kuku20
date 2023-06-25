import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ProductBrand {
  @PrimaryGeneratedColumn()
  Id: number;
  @Column()
  Name:string;
}