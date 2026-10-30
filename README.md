# QuickDrop: el plan de reparto

Este programa lee un dataset de QuickDrop (el mundo, los pedidos y los vehículos) y arma el plan de reparto: qué vehículo lleva cada pedido y en qué orden. Busca el plan más barato según el mismo costo con el que nos evalúa el simulador oficial, que suma la distancia recorrida, los vehículos usados, la hora a la que vuelve el último y los pedidos que no se entregan.

En la práctica de 40 pedidos llegamos a un costo de 913, el mismo que encuentra OR-Tools de Google con el mismo modelo, y usamos 2 de los 5 vehículos.

## Cómo se usa

Hace falta Node 24 o más nuevo. Primero se instalan las dependencias:

```bash
npm ci
```

Después se le pasa al programa la carpeta del dataset, o directamente el `.zip` que baja la web del simulador:

```bash
node src/cli.ts tests/cases/practica-40 --salida plan.json
```

El plan queda en `plan.json` (o en CSV si el nombre termina en `.csv`), y en la consola aparece el costo desglosado igual que en el simulador. Con `--estrategia insercion` se usa solo la estrategia base, y con `--semilla`, `--iteraciones` y `--corridas` se puede cambiar cuánto busca.

`npm run check` corre los tipos, el lint, el formato y los tests. `node scripts/benchmark.ts` repite la comparación de estrategias de `docs/benchmarks.md`.

## Cómo está armado

```
src/
  domain/    los datos del problema y nuestra versión del simulador oficial
  io/        lectura de JSON, CSV y .zip, y escritura del plan
  planner/   las estrategias y la cota inferior
  cli.ts     el programa que se corre en cada entrega
```

La idea principal es que el planificador no tiene su propia fórmula de costo: recorre las rutas con la misma función que usa el simulador. Así, lo que optimizamos es exactamente lo que nos van a medir, y si un evento cambia las reglas, se cambia en un solo lugar.

El planificador arranca con una inserción simple y la mejora con recocido simulado. En `docs/decisiones.md` contamos por qué elegimos cada cosa y qué descartamos.

## Cómo sabemos que anda

Tradujimos el simulador oficial de Python a TypeScript, así que lo primero era asegurarnos de que dieran lo mismo. `tests/official.test.ts` genera 120 planes al azar, algunos inválidos a propósito, y los pasa por los dos: coinciden en todos. Además, los casos publicados tienen un costo registrado que ningún cambio puede empeorar, y hay tests que prueban cientos de escenarios al azar para verificar que el plan siempre sea válido.
