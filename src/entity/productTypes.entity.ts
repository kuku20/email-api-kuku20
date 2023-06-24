import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ProductType {
  @PrimaryGeneratedColumn()
  Id: number;
  @Column()
  Name:string;
}