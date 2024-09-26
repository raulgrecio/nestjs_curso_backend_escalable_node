# Sección 07: MongoDB Pokedex

Esta sección enteramente se enfoca en la grabación a base de datos, pero puntualmente:

- Validaciones
- CRUD contra base de datos
- Docker y Docker Compose
- Conectar contenedor con filesystem (para mantener la data de la base de datos)
- Schemas
- Modelos
- DTOs y sus extensiones
- Respaldar a Github

## Inicio del proyecto - Pokedex

Vamos a crear un nuevo proyecto para esta sección, para ello usamos el siguiente comando, en mi caso usaré como gestor de paquetes a npm:

```bash
nest new pokedex
```

Recordar que para levantar el proyecto en modo desarrollo usamos el comando 

```bash
npm run start:dev
```

## Servir contenido estático

Podemos servir contenido estático con un proyecto frontend de nuestra preferencia, y se suele guardar dentro del directorio `public` en la raíz del proyecto. Por ejemplo tenemos un archivo `index.html` con el siguiente contenido:

```html
<!DOCTYPE html>
<html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="./css/style.css">
        <title>Pokedex</title>
    </head>

    <body>
        <h1>This is my website</h1>
    </body>

</html>
```

Y un archivo `css/style.css` con los siguientes estilos, añadiendo un reseteador de css:

```css
@import url('/css_reset.css');
html,
body {
    padding: 20px;
    background-color: gray;
}

h1 {
    font-size: 20px;
    color: white;
}
```

Ahora, para servir contenido estático dentro de la aplicación, necesitamos instalar un paquete con el siguiente comando:

```bash
npm install @nestjs/serve-static
```

Dentro del archivo `app.module.ts` añadimos la siguiente configuración:

```ts
import { Module } from '@nestjs/common'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'

@Module( {
    imports: [
        ServeStaticModule.forRoot( {
            rootPath: join( __dirname, '..', 'public' )
        } )
    ]
} )
export class AppModule { }
```

Con ello, al momento de ir al endpoint `http://localhost:3000` tendremos una página web personalizada como contenido estático.

## Global Prefix

Vamos a generar un resource para pokemon con el siguiente comando:

```bash
nest g res pokemon --no-spec
```

Un prefijo global es un segmento del endpoint que se comparte a través de todos los demás. En muchas apis podemos observar prefijos globales como `https://<url>/api/v1/<segmento de consulta>`, vamos a aplicar algo similar en nuestro backend con la siguiente configuración: Dentro del archivo `main.ts` aplicamos una configuración a nivel global:

```ts
async function bootstrap () {
    ...
    app.setGlobalPrefix( 'api' )
    ...
}
```

Con esto tendremos un endpoint como el siguiente `http://localhost:3000/api/pokemon/:id`.

## Docker - DockerCompose - MongoDB

Como estamos en modo de desarrollo, necesitamos una base de datos en la que podamos hacer acciones destructivas y que podamos levantar fácilmente. Una opción en Mongo Atlas, pero en trabajo colectivo no es muy buena idea. Mediante Docker podemos tener nuestra propia base de datos mediante una imagen, y podemos hacer acciones de prueba sin afectar a los demás.

DockerCompose es un archivo que nos facilita la creación de servicios instanciados de imágenes. No necesitamos maquinas virtuales para trabajar en ellas, y esto es una gran ventaja.

Dentro del proyecto, a nivel de raíz creamos un archivo llamado `docker-compose.yaml` en el que definimos el servicio de base de datos con una imagen de mongo en su versión 5, exponiendo el contenedor en el puerto `27017`, definiendo como variable de entorno el nombre de la base de datos, y creando un volumen para persistir la data dentro del proyecto y poder recuperarla si se elimina el contenedor con la base de datos:

```yaml
version: '3'

services:
    db:
        image: mongo:5
        restart: always
        ports:
            - 27017:27017
        container_name: pokedex-database
        environment:
            MONGODB_DATABASE: nest-pokemon
        volumes:
            - ./mongo:/data/db
```

Para ejecutar este archivo en modo `detach` o en segundo plano, usamos el siguiente comando con el que se descargan las diferentes layers de la imagen y se crea el contenedor:

```bash
docker-compose up -d
```

Como definimos que el volumen fuera de tipo bind-volume entre el equipo host y el contenedor, tendremos una nueva carpeta en el proyecto llamada `mongo`, la cual podemos añadir a la lista de `.gitignore` con el fin de no subirla al repositorio.

Finalmente, podemos hacer un seguimiento del contenedor con el comando de:

```bash
docker container ls
```

Mediante MondoDB Compass podemos conectarnos a la base de datos y probar que si está corriendo. Como URL para la conexión usamos el enlace `mongodb://localhost:27017/nest-pokemon`, y si obtenemos un OK en el test de conexión, hemos logrado crear todo bien, en caso contrario debemos observar los logs del contenedor con el siguiente comando:

```bash
docker logs <id del contenedor>
```

## Conectar Nest con Mongo

Vamos a usar un adaptador de `mongoose` creado por los desarrolladores de Nest con el fin de mantener nuestra aplicación más segura contra fallas del lado de la base de datos. Para la instalación usamos el siguiente comando:

```bash
npm install -s @nestjs/mongoose mongoose
```

Ahora dentro de `app.module.ts` creamos la referencia a nuestra base de datos:

```ts
import { MongooseModule } from '@nestjs/mongoose'
...

@Module( {
    imports: [
        ...,
        MongooseModule.forRoot( 'mongodb://localhost:27017/nest-pokemon' ),
        ...
    ]
} )
export class AppModule { }
```

Si no contamos con la base de datos, entonces tendremos un error en los logs del proyecto al momento de levantarlo, y no avanzará hasta que no reconozca la base de datos.

## Crear esquemas y modelos

Revisamos `https://pokeapi.co/api/v2/pokemon` para ver como es nuestro modelo de pokemon. Necesitamos definir como serán nuestras colecciones, y esto lo haremos a través de la entidad.  Una entidad es una clase con la que podemos definir reglas de negocio, en este caso definimos que estructura deben seguir las colecciones y como se hace la inserción de las instancias de la clase conocidas como documentos.

En la entidad del Pokemon establecemos mediante el decorador `@Schema` que siga esa estructura para las colecciones en la base de datos, luego hacemos que la clase extienda de `Document` mediante la cual heredamos propiedades y métodos propios de mongoose. Por defecto mongo genera un identificador único para cada documento, por lo cual no definimos esa propiedad dentro de la clase, pero añadimos la propiedad de nombre y número del pokemon, a las cuales también les añadimos un decorador llamado `@Prop` para indicarle que sean únicos en la base de datos y que tengan un indice para facilitar las búsquedas. Por últimos exportamos una schema que se crea a partir de la clase:

```ts
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { Document } from "mongoose"

@Schema()
export class Pokemon extends Document {
    @Prop( {
        unique: true,
        index: true
    } )
    name: string

    @Prop( {
        unique: true,
        index: true
    } )
    number: number
}

export const PokemonSchema = SchemaFactory.createForClass( Pokemon )
```

Dentro de `pokemon.module.ts` hacemos una declaración en los imports, en el cual le decimos a mongoose que reconozca un modelo, en el que obtenga el nombre de la entidad, y el esquema que exportamos:

```ts
import { MongooseModule } from '@nestjs/mongoose'
import { Pokemon, PokemonSchema } from './entities/pokemon.entity'
...

@Module( {
    ...,
    imports: [
        MongooseModule.forFeature( [
            {
                name: Pokemon.name,
                schema: PokemonSchema
            }
        ] )
    ]
} )
export class PokemonModule { }
```

Cuando levantamos el proyecto, podemos revisar en MongoDB Compass que la colección `pokemons` se ha creado correctamente.

## POST - Recibir y validar la data

Vamos a establecer las validaciones para la recepción de la data dentro de `CreatePokemonDTO`, pero primero necesitamos instalar las librerías para apoyarnos en los decoradores de validación:

```bash
npm i class-validator class-transformer
```

Luego usamos el pipe de validación a nivel global de la aplicación en `main.ts`

```ts
import { ValidationPipe } from '@nestjs/common'
...

async function bootstrap () {
    ...
    app.useGlobalPipes( new ValidationPipe( {
        whitelist: true,
        forbidNonWhitelisted: true,
        // Para poder transformar los datos directamente del body de string a int podemos 
        // añadir las siguiente lineas, tambien se puede hacer con @Transform en el DTO 
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    } ) )
    ...
}
```

Modificamos el DTO de creación:

```ts
import { IsInt, IsPositive, IsString, Min, MinLength } from "class-validator"

export class CreatePokemonDto {
    @IsString()
    @MinLength( 1 )
    name!: string

    @IsInt()
    @IsPositive()
    @Min( 1 )
    number!: number
}
```

## Crear pokemon en base de datos

Vamos a insertar los documentos en la base de datos. Para ello haremos la inyección de un modelo genérico de mongoose apuntando a nuestra entidad, dentro del servicio de pokemon:

```ts
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Pokemon } from './entities/pokemon.entity'
...

@Injectable()
export class PokemonService {
    constructor ( @InjectModel( Pokemon.name ) private readonly _pokemonModel: Model<Pokemon> ) { }
    ...
}
```

Lo siguiente es usar la inyección para el registro del nuevo documento, teniendo en cuenta que es un proceso asíncrono:

```ts
@Injectable()
export class PokemonService {
    ...
    async create ( createPokemonDto: CreatePokemonDto ) {
        createPokemonDto.name = createPokemonDto.name.toLowerCase()
        const pokemon = await this._pokemonModel.create( createPokemonDto )
        return pokemon
    }
}
```

Cuando grabamos el registro, podemos observar en TablePlus que ya ha sido almacenado correctamente. Pero, si intentamos guardar otro elemento con el valor de alguna de las propiedades repetidas, obtenemos un Internal Server Error por llaves duplicadas. En teoría, el error aparece como culpa del desarrollador y no por la acción del cliente, lo cual puede generar confusión de ambas partes.

## Responder un error especifico

Siempre es recomendable no hacer muchas peticiones a la base de datos, por lo tanto aprovechamos los mensajes de error que obtenemos al hacer una mala operación, para retornar una respuesta controlada, y esto es justo lo que vamos a hacer en caso de que se quiera crear un registro duplicado:

```ts
import { ..., BadRequestException, InternalServerErrorException } from '@nestjs/common'
...

@Injectable()
export class PokemonService {
    ...
    async create ( createPokemonDto: CreatePokemonDto ) {
        createPokemonDto.name = createPokemonDto.name.toLowerCase()
        try {
            const pokemon = await this._pokemonModel.create( createPokemonDto )
            return pokemon
        } catch ( error ) {
            if ( error.code === 11000 )
                throw new BadRequestException( `Pokemon exists in DB ${ JSON.stringify( error.keyValue ) }` )

            console.log( error )
            throw new InternalServerErrorException( `Can't create Pokemon - Check server logs` )
        }
    }
    ...
}
```

Actualmente, cada que creamos un registro obtenemos un código de respuesta `201 - Created`, pero si queremos que se responda con otro código de estatus, debemos hacer la siguiente configuración en el controlador:

```ts
import { ..., HttpCode } from '@nestjs/common'
...

@Controller( 'pokemon' )
export class PokemonController {
    ...
    @Post()
    @HttpCode( 200 )
    create ( @Body() createPokemonDto: CreatePokemonDto ) {
        return this.pokemonService.create( createPokemonDto )
    }
    ...
}
```

Y si no queremos equivocarnos, podemos usar un enum que nos ofrece el propio Nest con los códigos de error:

```ts
import { ..., HttpCode, HttpStatus } from '@nestjs/common'
...

@Controller( 'pokemon' )
export class PokemonController {
    ...
    @Post()
    @HttpCode( HttpStatus.OK )
    create ( @Body() createPokemonDto: CreatePokemonDto ) {
        return this.pokemonService.create( createPokemonDto )
    }
    ...
}
```

## FindOneBy - Buscar por name, MongoId y number

Vamos a crear un método dentro del servicio, que nos permita la búsqueda de un pokemon por su id, nombre o número asignado. Pero antes, haremos un cambio semántico en el parámetro del endpoint, ya que no queremos son un id, más bien queremos un termino de búsqueda que sea de tipo string:

```ts
@Controller( 'pokemon' )
export class PokemonController {
    ...
    @Get( ':term' )
    findOne ( @Param( 'term' ) term: string ) {
        return this.pokemonService.findOne( term )
    }
    ...
}
```

Dentro del método del servicio vamos a validar que si al momento de convertir en número es un número valido y no es un NaN, entonces busque mediante por la propiedad de `number`, si no es un número pero si es un identificador de mongo valido entonces hace la búsqueda por `_id`, si a este momento no ha encontrado ningún elemento, entonces busque por `name`. Finalmente, si no encuentra por ninguna de las propiedades, entonces regresa un 404:

```ts
import { isValidObjectId, ... } from 'mongoose'
...

@Injectable()
export class PokemonService {
    ...
    async findOne ( term: string ) {
        let pokemon: Pokemon
        if ( !isNaN( Number( term ) ) )
            pokemon = await this._pokemonModel.findOne( { number: term } )

        if ( !pokemon && isValidObjectId( term ) )
            pokemon = await this._pokemonModel.findById( term )

        if ( !pokemon )
            pokemon = await this._pokemonModel.findOne( { name: term.toLowerCase().trim() } )

        if ( !pokemon ) throw new NotFoundException( `Pokemon with id, name or number "${ term }" not found` )
        return pokemon
    }
    ...
}
```

## Actualizar Pokemon en base de datos

Vamos a actualizar un documento con la misma estrategia de la lección anterior, es decir, usando el name, number o id. En el controlador volvemos a aplicar el cambio del parámetro:

```ts
@Controller( 'pokemon' )
export class PokemonController {
    ...
    @Patch( ':term' )
    update ( @Param( 'term' ) term: string, @Body() updatePokemonDto: UpdatePokemonDto ) {
        return this.pokemonService.update( term, updatePokemonDto )
    }
    ...
}
```

En el servicio usamos el método de la lección anterior para buscar el documento a actualizar, si la información que está enviando desde el endpoint tiene la propiedad del nombre, la transformamos a minúscula, luego actualizamos el documento y retornamos la información:

```ts
@Injectable()
export class PokemonService {
    ...
    async update ( term: string, updatePokemonDto: UpdatePokemonDto ) {
        const pokemon = await this.findOne( term )

        if ( updatePokemonDto.name )
            updatePokemonDto.name = updatePokemonDto.name.toLowerCase()

        await pokemon.updateOne( updatePokemonDto, { new: true } )

        return pokemon
    }
    ...
}
```

Aquí hay un pequeño error, el registro se actualiza en base de datos, pero en la respuesta al endpoint se está retornando la información anterior. Para solucionar esto, retornamos un nuevo objeto con las propiedades dispersas del pokemon, sobreescribiendolas con la información enviada para actualizar:

```ts
@Injectable()
export class PokemonService {
    ...
    async update ( term: string, updatePokemonDto: UpdatePokemonDto ) {
        const pokemon = await this.findOne( term )

        if ( updatePokemonDto.name )
            updatePokemonDto.name = updatePokemonDto.name.toLowerCase()

        await pokemon.updateOne( updatePokemonDto, { new: true } )

        return { ...pokemon.toJSON(), ...updatePokemonDto }
    }
    ...
}
```

Es importante reconocer que tenemos valores únicos y por lo tanto no podemos repetirlos ni en la creación, ni en la actualización, y para controlar esto usamos un `try...catch` para evaluar el error y retornar un código personalizado y no un status 500:

```ts
@Injectable()
export class PokemonService {
    ...
    async update ( term: string, updatePokemonDto: UpdatePokemonDto ) {
        const pokemon = await this.findOne( term )

        if ( updatePokemonDto.name )
            updatePokemonDto.name = updatePokemonDto.name.toLowerCase()

        try {
            await pokemon.updateOne( updatePokemonDto, { new: true } )

            return { ...pokemon.toJSON(), ...updatePokemonDto }
        } catch ( error ) {
            if ( error.code === 11000 )
                throw new BadRequestException( `Pokemon exists in DB ${ JSON.stringify( error.keyValue ) }` )

            console.log( error )
            throw new InternalServerErrorException( `Can't create Pokemon - Check server logs` )
        }
    }
    ...
}
```

Como estamos viendo, estamos infligiendo el principio DRY, por lo que vamos a crear un método que se encargue de manejar los errores de las excepciones no controladas:

```ts
@Injectable()
export class PokemonService {
    constructor ( @InjectModel( Pokemon.name ) private readonly _pokemonModel: Model<Pokemon> ) { }

    async create ( createPokemonDto: CreatePokemonDto ) {
        ...
        try { ... } catch ( error ) {
            this._handleExceptions( error )
        }
    }

    async update ( term: string, updatePokemonDto: UpdatePokemonDto ) {
        ...
        try { ... } catch ( error ) {
            this._handleExceptions( error )
        }
    }
    
    private _handleExceptions ( error: any ) {
        if ( error.code === 11000 )
            throw new BadRequestException( `Pokemon exists in DB ${ JSON.stringify( error.keyValue ) }` )

        console.log( error )
        throw new InternalServerErrorException( `Can't create Pokemon - Check server logs` )
    }
}
```

## Eliminar un Pokemon

Vamos a eliminar un pokemon con el siguiente servicio:

```ts
@Injectable()
export class PokemonService {
    ...
    async remove ( id: string ) {
        const pokemon = await this.findOne( id )
        await pokemon.deleteOne()
    }
    ...
}
```

En estos momentos podemos usar el 'name', 'no' o 'id' para ejecutar la eliminación, en la siguiente lección vamos a crear un Pipe personalizado con nos ayude con la validación de que el parámetro de búsqueda tenga que ser exclisivamente un id de mongo (simplemente por lógica de negocio)

## CustomPipes - ParseMongoIdPipe

Vamos a crear un custom pipe que nos permita validar que el parámetro de eliminación siempre sea un id de mongo. En este caso el pipe será creado a nivel global, ya que todo nuestro proyecto trabaja con MongoDB.

Primero vamos a crear un módulo que almacenes elementos de uso común:

```bash
nest g mo common
```

Para generar un pipe sin archivo de test y sin carpeta usamos el siguiente comando:

```bash
nest g pi common/pipes/parse-mongo-id --no-spec --flat
```

El archivo que se genera tiene la siguiente estructura:

```ts
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class ParseMongoIdPipe implements PipeTransform {
    transform ( value: string, metadata: ArgumentMetadata ) {
        return value
    }
}
```

Vamos a usar dentro del método de eliminación en el controlador:

```ts
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe'
....

@Controller( 'pokemon' )
export class PokemonController {
    ...
    @Delete( ':id' )
    remove ( @Param( 'id', ParseMongoIdPipe ) id: string ) {
        return this.pokemonService.remove( id )
    }
}
```

Si imprimimos lo que recibe el pipe, tendremos un resultado como el siguiente:

```txt
{
    value: '63dab2df106b7e1f132cc658',
    metadata: { metatype: [Function: String], type: 'param', data: 'id' }
}
```

Vamos a transformar el pipe para obtener la función que habíamos mencionado anteriormente:

```ts
@Injectable()
export class ParseMongoIdPipe implements PipeTransform {
    transform ( value: string, metadata: ArgumentMetadata ) {
        if ( !isValidObjectId( value ) )
            throw new BadRequestException( `${ value } is not a valid MongoID` )
        return value
    }
}
```

De esta manera logramos que si no nos envían un Mongo ID valido, no pueda pasar al servicio de eliminación.

Vamos a simplificar un poco el servicio de eliminación, evitando hacer 2 consultas:

```ts
@Injectable()
export class PokemonService {
    ...
    async remove ( id: string ) {
        const result = await this._pokemonModel.findByIdAndDelete( id )
        await result
    }
    ...
}
```

El único inconveniente de este nuevo método consiste en que si enviamos un id valido pero no existente, nuestra aplicación aún así responde con un status 200.

## Validar y eliminar en una sola consulta

Vamos a evitar los falsos positivos, a no ser que queramos respuestas idempotentes, al momento de la eliminación usando el método `deleteOne` y analizando una de sus propiedades retornadas:

```ts
@Injectable()
export class PokemonService {
    ...
    async remove ( id: string ) {
        const { deletedCount } = await this._pokemonModel.deleteOne( { _id: id } )
        if ( deletedCount === 0 )
            throw new NotFoundException( `Pokemon with id ${ id } not found` )
        return
    }
    ...
}
```

Si no hay cambios aplicados sobre la base de datos, significa que no encontró el id y por lo tanto eliminamos un código 404, en caso contrario retornamos un status 200.