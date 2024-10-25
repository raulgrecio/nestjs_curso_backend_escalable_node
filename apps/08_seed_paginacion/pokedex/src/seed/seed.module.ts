import { Module } from '@nestjs/common';

import { CommonModule } from '../common/common.module';
import { PokemonModule } from '../pokemon/pokemon.module';

import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [CommonModule, PokemonModule],
})
export class SeedModule {}
