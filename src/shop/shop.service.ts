import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductBrand } from 'src/entity/ProductBrands.entity';
import { Product } from 'src/entity/product.entity';
import { ProductType } from 'src/entity/productTypes.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
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

  getAllProducts(){
    return this.productRepo.find()
  }

  getProduct(Id:number){
    return this.productRepo.findOne({ where: { Id } });
  }

  getBrands(){
    return this.brandRepo.find()
  }

  getTypes(){
    return this.typeRepo.find()
  }
}
