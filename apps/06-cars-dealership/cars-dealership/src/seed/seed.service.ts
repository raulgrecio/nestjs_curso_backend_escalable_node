import { Injectable } from '@nestjs/common';

import { CarsService } from '../cars/cars.service';
import { BrandsService } from '../brands/brands.service';

import { CARS_SEED } from './data/cars.seed';
import { BRAND_SEED } from './data/brands.seed';

@Injectable()
export class SeedService {
  constructor(
    private readonly carsService: CarsService,
    private readonly brandsService: BrandsService,
  ) {}

  populateDB() {
    this.brandsService.fillCarsWithSeedData(BRAND_SEED);
    this.carsService.fillCarsWithSeedData(CARS_SEED);

    return 'Seed executed';
  }
}
