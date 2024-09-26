// import { Transform } from 'class-transformer';
import { IsInt, IsPositive, IsString, MinLength } from 'class-validator';

export class CreatePokemonDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsInt()
  @IsPositive()
  // other options to transform
  // @Transform(({ value }) => {
  //   return parseInt(value);
  // })
  no: number;
}
