import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductBrand } from 'src/entity/ProductBrands.entity';
import { Product } from 'src/entity/product.entity';
import { ProductType } from 'src/entity/productTypes.entity';
import { Repository } from 'typeorm';
import { plainToClass, plainToInstance } from 'class-transformer';
import { ProductOutputDto } from 'src/dto/productOutputDto';
@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(ProductBrand)
    private brandRepo: Repository<ProductBrand>,
    @InjectRepository(ProductType)
    private typeRepo: Repository<ProductType>,
  ) {}

  async getAllProducts(): Promise<ProductOutputDto[]> {
    const products = await this.productRepo.find({
      relations: ['productType', 'productBrand'],
    });
  
    return plainToClass(ProductOutputDto, products);
  }

  async getProduct(Id: number){
    const product = await this.productRepo.findOne({
      where: { Id },
      relations: ['productType', 'productBrand'],
    });
    return plainToClass(ProductOutputDto,product);
  }

  getBrands(): Promise<ProductBrand[]> {
    return this.brandRepo.find();
  }

  getTypes(): Promise<ProductType[]> {
    return this.typeRepo.find();
  }
}
