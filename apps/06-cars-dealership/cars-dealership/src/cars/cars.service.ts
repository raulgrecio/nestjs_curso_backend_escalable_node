import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Car } from './interfaces/car.interface';
import { CreateCarDto, UpdateCarDto } from './dto';

@Injectable()
export class CarsService {
  private cars: Car[] = [];

  findAll() {
    return this.cars;
  }

  findOneById(id: string) {
    const foundCar = this.cars.find((car) => car.id === id);

    if (!foundCar) throw new NotFoundException(`Car with id '${id}' not found`);
    return foundCar;
  }

  create(createCarDto: CreateCarDto) {
    const newCar: Car = {
      id: uuid(),
      ...createCarDto,
    };

    //todo: insert in db
    this.cars.push(newCar);

    return newCar;
  }

  update(id: string, updateCarDto: UpdateCarDto) {
    const foundCar = this.findOneById(id);

    if (foundCar.id !== id) {
      throw new BadRequestException('Car id is not valid');
    }

    const updateCar = {
      ...foundCar,
      ...updateCarDto,
      id, // force id, it´s not necessary
    };

    //todo: update element in db
    const carsIndex = this.cars.findIndex((car) => car.id === id);
    this.cars[carsIndex] = updateCar;

    return updateCar;
  }

  delete(id: string) {
    this.findOneById(id); // guard
    this.cars = this.cars.filter((car) => car.id !== id);
  }

  fillCarsWithSeedData(cars: Car[]) {
    this.cars = cars;
  }
}
