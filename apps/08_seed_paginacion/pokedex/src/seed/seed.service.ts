import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interface';
import { Pokemon } from '../pokemon/entities/pokemon.entity';

@Injectable()
export class SeedService {
  //private readonly fetch = fetch

  async executeSeed() {
    const response = await fetch(
      'https://pokeapi.co/api/v2/pokemon?offset=0&limit=10',
    );

    if (!response.ok) throw new Error(`Error in call PokeAPI`);
    const data: PokeResponse = await response.json();

    const resultWithNo = <any>[];

    data.results.forEach(({ name, url }) => {
      const segments = url.split('/');
      const no: number = parseInt(segments[segments.length - 2]);
      resultWithNo.push({ name, no });
    });

    return resultWithNo;
  }
}
