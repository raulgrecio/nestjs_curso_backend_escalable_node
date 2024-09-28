# Sección 08: Seed y Paginación

Esta sección tiene por objetivo aprender:

- Uso de modelos en diferentes módulos
- SEED para llenar la base de datos
- Paginación de resultados
- DTOs para Query parameters
- Transformaciones de DTOs

También se mostrará varias formas de hacer inserciones por lote y como lograrlo.

## Continuación del proyecto

Vamos a seguir usando el proyecto de la sección anterior, por lo que podemos usar el siguiente comando para copiarlo:

```bash
cp -r 07_MongoDB_Pokedex/pokedex 08_seed_paginacion/ 
```

Hacemos la instalación de los `node_modules` con el siguiente comando:

```bash
npm install
```

Levantamos la base de datos con el comando:

```bash
docker-compose up -d
```

Y levantamos el proyecto con el siguiente comando:

```bash
npm start:dev
```

## Crear módulo SEED

Vamos a crear un módulo SEED que se encargue de llenar con registros la base de datos, de manera que luego podamos hacer la paginación y probarla de manera correcta. Lo primero será crear el módulo mediante un resource con el siguiente comando:


```bash
nest g res seed --no-spec
```

Lo siguiente será eliminar los DTOs puesto que no queremos validar nada de la petición, también eliminamos el Entity puesto que no queremos tener una colección Seed en la base de datos. Dentro del controlador solo dejamos el primer método GET sobre el que vamos a trabajar.

```ts
import { Controller, Get } from '@nestjs/common'
import { SeedService } from './seed.service'

@Controller( 'seed' )
export class SeedController {
    constructor ( private readonly seedService: SeedService ) { }

    @Get()
    executeSeed () {
        return this.seedService.populateDB()
    }
}
```

Igualmente, dentro del servicio solo vamos a dejar inicialmente un método que no retorna nada:

```ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class SeedService {
    populateDB () {
        return
    }
}
```

La manipulación de la data será llevada a cabo por los servicios, por lo tanto no vamos a tocar mucho el controlador en las siguientes acciones.



## Realizar petición HTTP desde Nest

Vamos a realizar una petición HTTP a `https://pokeapi.co/api/v2/pokemon` con el fin de obtener los pokemons e insertarlos en nuestra base de datos.

Dentro del servicio vamos a crear una instancia visible de axios (no es una dependencia), con el fin de realizar la petición al endpoint antes mencionado y obtener la data retornada por el mismo:

```ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class SeedService {

    async executeSeed () {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?offset=0&limit=10');
        const data = await response.json();
        return data
    }
}
```

Lo siguiente es generar el tipado de la respuesta para apoyarnos al momento del desarrollo y validación de la data. Podemos usar la extensión Paste JSON as Code y simplificar el trabajo. Las interfaces para la respuesta del servicio del seed de van a encontrar en el archivo `interfaces/poke-res.interface.ts`:

```ts
export interface PokeResponse {
    count: number
    next: string
    previous: string,
    results: Result[]
}

export interface Result {
    name: string
    url: string
}
```

Dentro del servicio vamos limpiar la data de cada pokemon, para obtener solo el nombre, y el id que tiene asignado dentro de la propiedad url al cual llamamos `no` en nuestra colección:

```ts
@Injectable()
export class SeedService {
    async executeSeed () {
        const response = await fetch(
          'https://pokeapi.co/api/v2/pokemon?offset=0&limit=10',
        );

        if (!response.ok) throw new Error(`Error in call PokeAPI`);
        const data: PokeResponse = await response.json();

        data.results.forEach( ({name, url }) => {
            const segments = url.split( '/' )
            const no: number = parseInt(segments[segments.length - 2]);
            console.log({name, no})
        })
        return
    }
}
```

Para la inserción de los pokemons debemos hacer la inyección del servicio de pokemon dentro del servicio seed, por lo tanto debemos exportar el primer service en su modulo, y posteriormente importar el módulo completo de pokemon dentro del módulo del seed:

```ts
import { PokemonService } from './pokemon.service'
...

@Module({
    ...,
    exports: [ PokemonService ]
})
export class PokemonModule { }
```

```ts
import { PokemonModule } from '../pokemon/pokemon.module'
...

@Module({
    ...,
    imports: [ PokemonModule ]
})
export class SeedModule { }
```

Ahora si procedemos a la inyección entre servicios:

```ts
import { PokemonService } from 'src/pokemon/pokemon.service'
...

@Injectable()
export class SeedService {
    constructor ( private readonly _pokemonService: PokemonService ) { }
    ...
}
```

Dentro del método para poblar la base de datos llamamos la función `create` del servicio de Pokemon, dentro de cada ciclo for para insertar la data:

```ts
@Injectable()
export class SeedService {
    constructor ( private readonly _pokemonService: PokemonService ) { }

    async executeSeed () {
        const response = await fetch(
          'https://pokeapi.co/api/v2/pokemon?offset=0&limit=10',
        );

        if (!response.ok) throw new Error(`Error in call PokeAPI`);
        const data: PokeResponse = await response.json();

        data.results.forEach( ({name, url }) => {
            const segments = url.split( '/' )
            const no: number = parseInt(segments[segments.length - 2]);
            this._pokemonService.create({name: name.toLowerCase(), no})
        })

        return
    }
}
```

Otra manera es usando el modelo de Pokemon y no el servicio del mismo módulo. Lo primero será exportar la configuración del módulo de mongoose dentro del módulo de Pokemon

```ts
import { MongooseModule } from '@nestjs/mongoose'
...

@Module({
    ...,
    imports: [
        MongooseModule.forFeature([
            {
                name: Pokemon.name,
                schema: PokemonSchema
            }
        ])
    ],
    exports: [ MongooseModule ]
})
export class PokemonModule { }
```

Seguimos con la importación del módulo de Pokemon dentro del módulo Seed, pero si vamos a modificar el servicio de la siguiente manera:

```ts
@Injectable()
export class SeedService {
    constructor ( @InjectMode( Pokemon.name ) private readonly _pokemonModel: Model<Pokemon> ) { }

    async executeSeed () {
        const response = await fetch(
          'https://pokeapi.co/api/v2/pokemon?offset=0&limit=10',
        );

        if (!response.ok) throw new Error(`Error in call PokeAPI`);
        const data: PokeResponse = await response.json();

        await this._pokemonModel.deleteMany({})
        data.results.forEach( async ({name, url }) => {
            const segments = url.split( '/' )
            const no: number = parseInt(segments[segments.length - 2]);
            const pokemon = await this._pokemonModel.create({name: name.toLowerCase(), no})
        })
        return
    }
}
```

Con el anterior método usamos la inserción 1 a 1 de los registros, pero podemos usar la inserción múltiple que ya nos ofrece mongoose. El tiempo de ejecución está en un rango similar al anterior, pero el código es más limpio:

```ts
@Injectable()
export class SeedService {
    ...
    constructor (
        @InjectModel( Pokemon.name ) private readonly _pokemonModel: Model<Pokemon>
    ) { }

    async executeSeed () {
        const response = await fetch(
          'https://pokeapi.co/api/v2/pokemon?offset=0&limit=10',
        );

        if (!response.ok) throw new Error(`Error in call PokeAPI`);
        const data: PokeResponse = await response.json();

        const pokemonToInsert: {name: string, no: number}[] = []
        data.results.forEach( async ({name, url}) => {
            const segments = url.split('/')
            const no: number = parseInt(segments[segments.length - 2]);
            pokemonToInsert.push({name: name.toLowerCase(), no})
        })

        await this._pokemonModel.deleteMany({})
        await this._pokemonModel.insertMany(pokemonToInsert)

        return "Seed Executed"
    }
}
```

En siguientes secciones vamos a ver otra opción y cual podría ser mejor para la inserción de múltiples documentos.

## Insertar múltiples registros simultáneamente

En la lección anterior vimos dos opciones de como guardar los registros en el servicio del Seed. Tanto la primera como la segunda opción presentan el inconveniente de que es muy tardada la inserción de los datos dentro de la base de datos, puesto que se tiene que esperar que termine una inserción para pasar a la siguiente, entonces, si son múltiples registros el tiempo se incrementa por cada uno. Al momento de imprimir el tiempo de ejecución desde el controlador, con los dos métodos anteriores tenemos resultados en un rango de entre `40ms` a `55ms`.

Vamos a intentar con otra solución, en la cual creamos un arreglo al cual le enviamos todas las promesas de inserción en la base de datos en cada recorrido del array, y luego ejecutamos todas las promesas mediante `Promises.all`. El tiempo de ejecución va de los `0.1ms` a los `3ms`:

```ts
@Injectable()
export class SeedService {
    ...
    constructor (
        @InjectModel( Pokemon.name ) private readonly _pokemonModel: Model<Pokemon>
    ) { }

    async executeSeed () {
        const response = await fetch(
          'https://pokeapi.co/api/v2/pokemon?offset=0&limit=10',
        );

        if (!response.ok) throw new Error(`Error in call PokeAPI`);
        const data: PokeResponse = await response.json();

        const insertPromisesArray = []
        data.results.forEach( async ({name, url }) => {
            const segments = url.split( '/' )
            const no: number = parseInt(segments[segments.length - 2]);
            insertPromisesArray.push(
                this._pokemonModel.create({name: name.toLowerCase(), no})
            )
        })

        await this._pokemonModel.deleteMany({})
        await Promise.all( insertPromisesArray )

        return "Seed Executed"
    }
}
```

Con el anterior método usamos la inserción 1 a 1 de los registros, pero podemos usar la inserción múltiple que ya nos ofrece mongoose. El tiempo de ejecución está en un rango similar al anterior, pero el código es más limpio:

```ts
@Injectable()
export class SeedService {
    ...
    constructor (
        @InjectModel( Pokemon.name ) private readonly _pokemonModel: Model<Pokemon>
    ) { }

    async executeSeed () {
        const response = await fetch(
          'https://pokeapi.co/api/v2/pokemon?offset=0&limit=10',
        );

        if (!response.ok) throw new Error(`Error in call PokeAPI`);
        const data: PokeResponse = await response.json();

        const pokemonToInsert: { name: string, number: number }[] = []
        data.results.forEach( async ({name, url }) => {
            const segments = url.split( '/' )
            const no: number = parseInt(segments[segments.length - 2]);
            pokemonToInsert.push({name: name.toLowerCase(), no})
        })

        await this._pokemonModel.deleteMany({})
        await this._pokemonModel.insertMany( pokemonToInsert )

        return "Seed Executed"
    }
}
```

La última opcion es trasladar el seed al modulo de Pokemon para eso:
creamos un nuevo método con tal proposito en el `pokemoService`:

```ts

...
  async seed(seedDto: CreatePokemonDto[]) {
    await this.pokemonModel.deleteMany({});
    await this.pokemonModel.insertMany(seedDto);
  }
...

```

exportamos `pokemonService` desde `PokemonModule`

```ts
@Module({
  ...
  exports: [PokemonService],
})
```

lo importamos desde `SeedModule`
```ts
@Module({
  ...
  imports: [PokemonModule],
})
```

Y por ultimo realizamos la llamada al `pokemonService` desde el metodo `executeSeed` pasando los datos a insertar

```ts
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
```