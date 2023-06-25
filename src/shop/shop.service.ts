import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductBrand } from 'src/entity/ProductBrands.entity';
import { Product } from 'src/entity/product.entity';
import { ProductType } from 'src/entity/productTypes.entity';
import { Repository } from 'typeorm';
import { plainToClass, plainToInstance } from 'class-transformer';
import { ProductOutputDto } from 'src/dto/out/productOutputDto';
import { PaginationDto } from 'src/dto/out/paginatiorDto';
import { BrandsDto } from 'src/dto/out/brandsOutDto';
import { TypesDto } from 'src/dto/out/typesOutDto';
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

  async getAllProducts() {
    const products = await this.productRepo.find({
      relations: ['ProductType', 'ProductBrand'],
    });
    // return products;
    return plainToInstance(ProductOutputDto, products);
  }

  async getProduct(Id: number) : Promise<ProductOutputDto>{
    const product = await this.productRepo.findOne({
      where: { Id },
      relations: ['ProductType', 'ProductBrand'],
    });
    // return product;
    return plainToInstance(ProductOutputDto,product);
  }

  async getBrands() : Promise<BrandsDto[]> {
     const brands =  await this.brandRepo.find();
     return plainToInstance(BrandsDto,brands);
  }

  async getTypes(): Promise<TypesDto[]> {
    const types =  await this.typeRepo.find();
     return plainToInstance(TypesDto,types);
  }

  async getPaginatedProducts(pageIndex: number, pageSize: number): Promise<PaginationDto<ProductOutputDto>> {
    const [data, count] = await this.productRepo.findAndCount({
      relations: ['ProductType', 'ProductBrand'],
      skip: (pageIndex - 1) * pageSize,
      take: pageSize,
    });
  
    const products = plainToInstance(ProductOutputDto, data);
  
    return {
      count,
      pageIndex,
      pageSize,
      data: products,
    };
  }
  
}