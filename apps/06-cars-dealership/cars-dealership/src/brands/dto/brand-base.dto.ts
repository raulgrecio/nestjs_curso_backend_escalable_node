import { IsString, MaxLength, MinLength } from 'class-validator';

export class BrandBaseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(16)
  readonly name: string;
}
