import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { CarBaseDto } from './car-base.dto';

export class UpdateCarDto extends PartialType(CarBaseDto) {
  @IsString()
  @IsOptional()
  @IsUUID()
  readonly id?: string;

  @IsOptional()
  readonly model?: string;

  @IsOptional()
  readonly brand?: string;
}
