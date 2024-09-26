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