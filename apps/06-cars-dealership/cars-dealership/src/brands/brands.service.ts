import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand } from './entities/brand.entity';

@Injectable()
export class BrandsService {
  private brands: Brand[] = [];

  create(createBrandDto: CreateBrandDto) {
    const { name } = createBrandDto;

    const newBrand: Brand = {
      id: uuid(),
      name: name.toLowerCase(),
      createdAt: new Date().getTime(),
    };

    this.brands.push(newBrand);

    return newBrand;
  }

  findAll() {
    return this.brands;
  }

  findOne(id: string) {
    const foundBrand = this.brands.find((brand) => brand.id === id);

    if (!foundBrand) new NotFoundException(`Brand with id '${id}' not found`);

    return foundBrand;
  }

  update(id: string, updateBrandDto: UpdateBrandDto) {
    const foundBrand = this.findOne(id);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name } = updateBrandDto;

    const updateBrand: Brand = {
      ...foundBrand,
      name: name.toLowerCase(),
      updatedAt: new Date().getTime(),
      id,
    };

    this.brands = this.brands.map((brand) => {
      if (brand.id === id) {
        return updateBrand;
      }
      return brand;
    });

    return updateBrand;
  }

  remove(id: string) {
    this.brands = this.brands.filter((brand) => brand.id !== id);
  }

  fillCarsWithSeedData(brands: Brand[]) {
    this.brands = brands;
  }
}
