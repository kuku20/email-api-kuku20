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

      async seedData() {
        const seedData = [
          {
            "Id": 1,
            "Name": "Boards"
          },
          {
            "Id": 2,
            "Name": "Hats"
          },
          {
            "Id": 3,
            "Name": "Boots"
          },
          {
            "Id": 4,
            "Name": "Gloves"
          }
        ]
    
        const productTypes = seedData.map(data => this.typeRepo.create(data));
        await this.typeRepo.save(productTypes);
        console.log('Product types seeded successfully!');
      }









}
