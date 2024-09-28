import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interface';
import { PokemonService } from '../pokemon/pokemon.service';

@Injectable()
export class SeedService {
  constructor(private readonly pokemonService: PokemonService) {}

  async executeSeed() {
    const response = await fetch(
      'https://pokeapi.co/api/v2/pokemon?offset=0&limit=650',
    );

    if (!response.ok) throw new Error(`Error in call PokeAPI`);
    const data: PokeResponse = await response.json();

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
