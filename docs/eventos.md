# Cómo nos adaptamos a cada evento

Cada evento cambia el simulador oficial. Nuestra forma de responder es siempre la misma: traducir el cambio a nuestro simulador (`src/domain/simulate.ts`), leer los campos nuevos y dejar que el planificador optimice el costo nuevo. La búsqueda no conoce las reglas: solo ve el costo.

Los minutos van desde que recibimos el evento hasta el commit que lo resuelve. Los archivos y líneas son de código de producción, sin tests ni pantallas.

| Evento              | Qué cambió                                                                                                                                 | Cómo lo resolvimos                                                                                                                                                | Archivos | Líneas | Minutos | Tests nuevos |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ | ------- | ------------ |
| 1 · Pedidos premium | Algunos pedidos son premium. Por cada uno se paga `costo_por_minuto_premium` por cada minuto desde la salida hasta que empieza su entrega. | Leímos el campo nuevo, sumamos el término al simulador y a la cota inferior. El planificador no cambió: al optimizar el costo nuevo, adelanta solo a los premium. | 7        | 117    | 23      | 4            |

## Evento 1: pedidos premium

Recibido a las 17:06. A las 17:21 el programa ya daba el mismo costo que el simulador oficial actualizado en el ejemplo, en la práctica base y en la práctica del evento.

- Práctica del evento (40 pedidos, 6 premium): 1.402. OR-Tools con el mismo costo da 1.447 con 10 s y 1.402 con 60 s; nosotros, 1.402 en 5,7 s.
- El ejemplo oficial ahora trae premium: el plan de ejemplo pasó a costar 1.124 y el nuestro, 811.
- La práctica base sigue en 913.

Lo que tocamos: el tipo de pedido y los costos (`types.ts`), el simulador (`simulate.ts`), la lectura (`scenario.ts`), el evaluador del planificador (`evaluation.ts`), la cota (`lower-bound.ts`), el generador de escenarios y una línea del CLI. Fueron tres módulos (dominio, lectura y planificador), uno más de lo que nos gustaría. En el planificador aprovechamos para que el evaluador use la misma función de costo que el simulador, así el próximo cambio de costo se toca en un solo lugar.

En la presentación, los premium se dibujan como rombos: la forma dice la prioridad y el color, la camioneta.
