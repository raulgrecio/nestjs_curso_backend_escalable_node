import { IsString, MaxLength, MinLength } from 'class-validator';

export class CarBaseDto {
  @IsString()
  readonly model: string;

  @IsString()
  @MinLength(3)
  @MaxLength(16)
  readonly brand: string;
}
