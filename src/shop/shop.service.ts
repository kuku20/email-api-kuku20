import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductBrand } from 'src/shop/ProductBrands.entity';
import { Product } from 'src/shop/product.entity';
import { ProductType } from 'src/shop/productTypes.entity';
import { Repository } from 'typeorm';
import { plainToClass, plainToInstance } from 'class-transformer';

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
    return products;

  }

  async getProduct(Id: number): Promise<any> {
    const product = await this.productRepo.findOne({
      where: { Id },
      relations: ['ProductType', 'ProductBrand'],
    });
    return product;

  }

  async getBrands(): Promise<any[]> {
    return await this.brandRepo.find();

  }

  async getTypes(): Promise<any[]> {
    return await this.typeRepo.find();
  }

  async getPaginatedProducts(
    pageIndex: number,
    pageSize: number,
    sort: string,
    brandId: number,
    typeId: number,
  ){
    const queryBuilder = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.ProductBrand', 'ProductBrand')
      .leftJoinAndSelect('product.ProductType', 'ProductType');

    queryBuilder.orderBy('product.Name');
    // Apply sorting based on the sort parameter
    if (sort === 'priceAsc') {
      queryBuilder.orderBy('product.Price', 'ASC');
    } else if (sort === 'priceDesc') {
      queryBuilder.orderBy('product.Price', 'DESC');
    }

    const skip = (pageIndex - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    if (brandId) {
      queryBuilder.where('product.ProductBrandId = :brandId', { brandId });
    }
    if (typeId) {
      queryBuilder.where('product.ProductTypeId = :typeId', { typeId });
    }

    const [data, count] = await queryBuilder.getManyAndCount();


    return {
      count,
      pageIndex,
      pageSize,
      data: data,
    };
  }

  async getProductWithRelations(id: number): Promise<any> {
    const product = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.ProductBrand', 'ProductBrand')
      .leftJoinAndSelect('product.ProductType', 'ProductType')
      // .where('product.Id = :id', { id })
      // .getOne();
      .getMany();

    return product;

  }
}
