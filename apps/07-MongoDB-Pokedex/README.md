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

```txt
$: nest new pokedex
```

Recordar que para levantar el proyecto en modo desarrollo usamos el comando `npm run start:dev`

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

```txt
$: npm install @nestjs/serve-static
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

```txt
$: nest g res pokemon --no-spec
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

```txt
$: docker-compose up -d
```

Como definimos que el volumen fuera de tipo bind-volume entre el equipo host y el contenedor, tendremos una nueva carpeta en el proyecto llamada `mongo`, la cual podemos añadir a la lista de `.gitignore` con el fin de no subirla al repositorio.

Finalmente, podemos hacer un seguimiento del contenedor con el comando de:

```txt
$: docker container ls
```

Mediante MondoDB Compass podemos conectarnos a la base de datos y probar que si está corriendo. Como URL para la conexión usamos el enlace `mongodb://localhost:27017/nest-pokemon`, y si obtenemos un OK en el test de conexión, hemos logrado crear todo bien, en caso contrario debemos observar los logs del contenedor con el siguiente comando:

```txt
$: docker logs <id del contenedor>
```
