import { IsEmail, IsString, IsOptional, IsNumber } from 'class-validator';

export class ProductDto {
    @IsString()
    name:string;
    @IsString()
    description:string;
    @IsNumber()
    price:string;
    @IsString()
    pictureUrl:string;
    @IsString()
    productType:string;
    @IsString()
    productBrand:string;
}
