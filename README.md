# ia-test-board

Aplicacion de escritorio para seguimiento de testing continuo, construida con Electron + Angular + SQLite + Knex.

## Stack

- Electron (proceso main)
- Angular (renderer)
- SQLite
- Knex para migraciones y consultas

## Pantallas

- `Tasks Board`
  - columnas: `En espera`, `En ejecucion`, `Ejecutando`
  - cards con:
    - ultimo resultado (`OK` o `Falla + causa`)
    - variables de entrada
    - pasos de reproduccion
    - resultado esperado
    - agente asignado
- `Real Time Status`
  - ultima corrida terminada:
    - cantidad de fallos
    - cantidad de OK
    - top 5 causas de fallo

## Scripts

- `npm start`: levanta Angular + Electron en desarrollo
- `npm run db:migrate`: ejecuta migraciones Knex
- `npm run db:seed`: carga datos de ejemplo
- `npm run lint`: lint de Angular

## Base de datos

- archivo SQLite: `app/db/data/ia-test-board.sqlite3`
- migraciones: `app/db/migrations`
- seeds: `app/db/seeds`

## Flujo recomendado local

1. `npm install`
2. `npm run db:migrate`
3. `npm run db:seed`
4. `npm start`
