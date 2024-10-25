import { Injectable } from '@nestjs/common';

//import { AxiosAdapter } from '../common/adapters/axios.adapter';
import { FetchAdapter } from '../common/adapters/fetch.adapter';
import { PokemonService } from '../pokemon/pokemon.service';

import { PokeResponse } from './interfaces/poke-response.interface';

@Injectable()
export class SeedService {
  constructor(
    private readonly pokemonService: PokemonService,
    private readonly http: FetchAdapter,
  ) {}

  async executeSeed() {
    const data = await this.http.get<PokeResponse>(
      'https://pokeapi.co/api/v2/pokemon?offset=0&limit=650',
    );

    const pokemonToInsert: Array<{ name: string; no: number }> = [];
    data.results.forEach(({ name, url }) => {
      const segments = url.split('/');
      const no: number = parseInt(segments[segments.length - 2]);
      pokemonToInsert.push({ name: name.toLowerCase(), no });
    });

    await this.pokemonService.seed(pokemonToInsert);
    return 'Seed executed';
  }
}
