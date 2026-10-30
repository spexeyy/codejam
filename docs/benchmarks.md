# Benchmarks

Antes de confiar en el planificador quisimos saber dos cosas: si lo que encuentra es bueno, y si sigue siendo bueno con datasets que no vimos, que es como nos van a evaluar.

## Cómo lo medimos

Usamos la práctica oficial de 40 pedidos y 20 escenarios generados con `node scripts/benchmark.ts`, del mismo tamaño que anuncia la organización para el Nivel 3: 40 pedidos al azar en la grilla de 20 × 20, 5 vehículos, el depósito en cualquier lugar y los costos por defecto. Todos los planes pasan por el simulador, así que los costos son los oficiales.

Comparamos contra tres referencias:

- OR-Tools de Google con el mismo modelo de costo (3 por cuadra, 60 fijos por vehículo y el makespan), buscando 10 segundos.
- La mejor solución conocida de cada escenario, que es la más barata que encontró cualquiera de los métodos.
- La cota inferior de `src/planner/lower-bound.ts`: un costo por debajo del cual está demostrado que no hay ningún plan que entregue todo.

Los tiempos son de una notebook con Apple Silicon, en un solo hilo.

## La práctica oficial

| Método                                          | Costo | Tiempo |
| ----------------------------------------------- | ----- | ------ |
| Inserción más barata                            | 941   | 0,01 s |
| Recocido simulado (lo que usamos)               | 913   | 6 s    |
| Nuestro recocido con 80 millones de iteraciones | 913   | 32 s   |
| OR-Tools, 10 s                                  | 913   | 10 s   |
| OR-Tools, 60 s                                  | 913   | 60 s   |
| Cota inferior                                   | 767   | 0,02 s |

Todos los métodos llegan a 913, así que es muy probable que sea el óptimo o algo muy cerca. El plan usa 2 de los 5 vehículos, recorre 154 cuadras y el último vuelve a las 13:31.

## 20 escenarios nuevos

Acá medimos el gap: cuánto más caro sale cada método que la mejor solución conocida de cada escenario.

| Versión                                                        | Gap medio | Peor caso | Casos donde llega a la mejor | Tiempo medio |
| -------------------------------------------------------------- | --------- | --------- | ---------------------------- | ------------ |
| Inserción más barata                                           | 6,50 %    | 14,77 %   | 2 de 20                      | 0,01 s       |
| Primera versión del recocido                                   | 1,05 %    | 4,87 %    | 12 de 20                     | 1,8 s        |
| Primera versión, con 5 veces más iteraciones                   | 0,75 %    | 4,87 %    | 14 de 20                     | 8,9 s        |
| Con ruina y recreación, una corrida por flota                  | 0,09 %    | 1,56 %    | 17 de 20                     | 2,9 s        |
| Con ruina y recreación, dos corridas por flota (lo que usamos) | 0 %       | 0 %       | 20 de 20                     | 6,0 s        |
| OR-Tools, 10 s                                                 | 0,23 %    | 1,29 %    | 14 de 20                     | 10 s         |

Lo que sacamos de esta tabla:

- La primera versión tenía un problema que no se arreglaba con más tiempo: con cinco veces más iteraciones, el peor caso seguía en 4,87 %. Lo arregló un movimiento nuevo, la ruina y recreación, que le permite cerrar un vehículo de una vez. La historia completa está en `docs/decisiones.md`.
- Con la versión final, en ninguno de los 20 escenarios otro método encontró un plan más barato. Contra OR-Tools le ganamos en 6, empatamos en 14 y no perdimos en ninguno.
- Usar los 5 vehículos nunca conviene: el plan usa 2 en 17 escenarios y 3 en los otros 3.
- La mejor solución conocida queda en promedio un 12,7 % por encima de la cota inferior, y como mucho un 17,1 %. El óptimo está en ese rango. La cota no da más porque acota el makespan de varias rutas con un promedio, que es una cuenta floja.

El detalle por escenario:

| Escenario | Inserción | Primera versión | Versión final | OR-Tools 10 s | Cota inferior |
| --------- | --------- | --------------- | ------------- | ------------- | ------------- |
| 1         | 946       | 916             | 916           | 916           | 783           |
| 2         | 901       | 854             | 854           | 854           | 767           |
| 3         | 922       | 887             | 870           | 870           | 743           |
| 4         | 917       | 833             | 833           | 833           | 763           |
| 5         | 948       | 858             | 826           | 826           | 743           |
| 6         | 909       | 867             | 867           | 867           | 771           |
| 7         | 915       | 879             | 879           | 886           | 755           |
| 8         | 887       | 848             | 843           | 851           | 755           |
| 9         | 797       | 797             | 797           | 797           | 719           |
| 10        | 941       | 850             | 850           | 861           | 759           |
| 11        | 826       | 789             | 771           | 771           | 703           |
| 12        | 948       | 926             | 883           | 887           | 767           |
| 13        | 903       | 862             | 851           | 851           | 743           |
| 14        | 867       | 867             | 867           | 875           | 787           |
| 15        | 914       | 851             | 851           | 851           | 763           |
| 16        | 957       | 886             | 859           | 860           | 751           |
| 17        | 888       | 833             | 833           | 833           | 751           |
| 18        | 916       | 849             | 849           | 849           | 751           |
| 19        | 944       | 879             | 879           | 879           | 767           |
| 20        | 880       | 869             | 844           | 844           | 755           |

## Cómo elegimos la temperatura del recocido

Probamos varias temperaturas iniciales en la práctica, con un millón de iteraciones y cuatro semillas cada una (con la primera versión del recocido):

| Temperatura inicial     | Costo con cada semilla |
| ----------------------- | ---------------------- |
| 0,5 % del costo inicial | 913, 913, 913, 913     |
| 1 %                     | 922, 914, 913, 922     |
| 2 %                     | 924, 923, 941, 941     |
| 4 %                     | 913, 913, 924, 924     |

Nos quedamos con 0,5 % porque fue la única que llegó a 913 con las cuatro semillas.
