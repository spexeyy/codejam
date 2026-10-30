# Decisiones

Acá anotamos las decisiones que tomamos durante la jornada, qué otras opciones teníamos y qué nos cuesta cada una.

## Optimizar el costo completo, no solo la distancia

Lo primero que hicimos fue mirar bien la fórmula de costo. No es un problema de ruteo clásico donde solo importa recorrer menos: también se paga un costo fijo por cada vehículo que sale y se paga el makespan, es decir, la hora a la que vuelve el último vehículo. Eso cambia todo. Usar más vehículos acorta la jornada pero suma costo fijo y kilómetros desde el depósito, y una ruta mucho más larga que las otras sale cara aunque la distancia total sea baja.

Por eso el planificador optimiza la fórmula entera, con los pesos que trae cada dataset. En la práctica, el mejor plan usa 2 de los 5 vehículos. La desventaja es que cada evaluación tiene que simular las rutas en lugar de sumar distancias, pero con 40 pedidos igual hacemos un millón de evaluaciones en menos de un segundo.

## TypeScript, y nuestra propia versión del simulador

El simulador oficial está en Python, y la opción obvia era escribir todo en Python y usarlo directamente. Elegimos TypeScript por dos razones. La primera es que así el mismo código corre en la consola y en el navegador, y la interfaz puede recalcular un plan en vivo sin un servidor. La segunda es la velocidad: nuestro primer prototipo en Python hizo unas 170 mil iteraciones por segundo, y el recocido en TypeScript hace cerca de 1,7 millones.

Eso nos obligó a traducir el simulador a `src/domain/simulate.ts`, y una traducción puede tener errores. Para controlarlo, `tests/official.test.ts` corre 120 planes al azar (con recargas, pedidos repetidos, pedidos que no existen y pedidos sin entregar) en los dos simuladores y compara el resultado. Dan la misma validez y el mismo costo en todos. El planificador usa la misma función de recorrido que el simulador, así que el costo que optimiza es el oficial.

Lo que perdemos: cuando un evento cambie el simulador, quien trabaja en Python hace `git pull` y nosotros tenemos que traducir el cambio. Es un solo archivo, y el test nos avisa si nos separamos.

## Una estrategia base y una que la mejora

La base es una inserción más barata. Ordenamos los pedidos por ángulo alrededor del depósito y los repartimos en sectores, uno por vehículo, para que cada ruta arranque hacia una zona distinta de la ciudad. Después metemos cada pedido en la posición donde menos sube el costo total. Lo probamos con 1, 2, 3, 4 y 5 vehículos y nos quedamos con el más barato. Tarda una centésima de segundo y en la práctica da 941.

Encima corre un recocido simulado: a partir de ese plan prueba cambios chicos, como mover un pedido, intercambiar dos, dar vuelta un tramo o cruzar el final de dos rutas. Si el cambio mejora, se queda. Si empeora, a veces también, sobre todo al principio, para no quedar atrapado en un plan que parece bueno solo porque ningún cambio chico lo mejora. En la práctica llega a 913.

Descartamos usar OR-Tools como motor: no corre en el navegador, no explica sus decisiones y cada regla nueva habría que traducirla a su modelo. Lo usamos como vara de comparación.

## El benchmark nos mostró un problema, y lo arreglamos

La primera versión del recocido hacía cuatro corridas desde el mejor plan de la inserción. En la práctica funcionaba, pero al probarla en 20 escenarios nuevos vimos que en algunos quedaba hasta un 4,9 % por encima de la mejor solución conocida. Le dimos cinco veces más iteraciones y el peor caso no cambió. No era falta de tiempo.

El problema era de diseño. Para pasar de 3 vehículos a 2, la búsqueda tenía que vaciar un vehículo moviendo sus pedidos de a uno, y cada uno de esos pasos empeora el plan hasta que el último pedido sale y se ahorra el costo fijo. Eso casi nunca pasaba.

Lo resolvimos con dos cambios. Agregamos un movimiento de ruina y recreación, tomado de SISR (Christiaens y Vanden Berghe, 2020), que saca de una vez todos los pedidos de un vehículo, o un grupo de pedidos cercanos, y los vuelve a insertar donde menos cuestan. Y en lugar de arrancar siempre del mismo plan, hacemos dos corridas desde la inserción de cada tamaño de flota. Con eso, en los 20 escenarios ningún método encontró un plan más barato que el nuestro. El costo fue el tiempo: pasamos de 1,7 a unos 6 segundos, y en cada entrega tenemos varios minutos.

## La temperatura del recocido la medimos

La receta habitual es arrancar con una temperatura que acepte la mitad de los empeoramientos típicos. La probamos y la búsqueda se dispersaba: terminaba en 941, igual que la inserción. Medimos varias temperaturas con cuatro semillas cada una y la única que llegó a 913 en las cuatro fue arrancar con el 0,5 % del costo inicial y enfriar 200 veces. Los números están en `docs/benchmarks.md`. Si los datasets fueran mucho más grandes habría que volver a medir.

## Iteraciones fijas y semilla, en lugar de un tiempo límite

El recocido corre un número fijo de iteraciones con semillas fijas, no "durante 5 segundos". Así el mismo dataset da siempre el mismo plan en cualquier computadora, y lo podemos testear. En una máquina más lenta tarda más, pero el resultado es el mismo.

## Un pedido se deja sin entregar solo si conviene

Si sacar un pedido del plan ahorra más que la multa por no entregarlo, el programa no lo entrega. Con los costos de la práctica no pasa nunca, pero los costos vienen en cada dataset y pueden cambiar. Hay un test con una multa de 1 en el que, como corresponde, no se entrega nada.

## Medir qué tan lejos estamos del óptimo

El problema es NP-difícil, así que no podemos calcular el óptimo exacto para 40 pedidos. Lo que sí podemos hacer es acotarlo desde los dos lados.

Desde arriba, comparamos contra OR-Tools con el mismo modelo de costo y contra corridas nuestras mucho más largas. Ninguno encontró nada mejor que nuestro plan en la práctica ni en los 20 escenarios.

Desde abajo, calculamos una cota inferior demostrada. Si juntamos las rutas en el depósito, queda un recorrido cerrado que pasa por todos los pedidos, así que la distancia total no puede ser menor que el mejor recorrido de un solo vehículo. Ese recorrido lo acotamos con el método de Held y Karp (1970), un árbol generador con multiplicadores de Lagrange. El makespan tampoco puede ser menor que el promedio de las rutas ni que ir y volver al pedido más lejano. En la práctica, eso da que ningún plan que entregue todo puede costar menos de 767. Nuestro plan cuesta 913, así que el óptimo está en ese rango.

La cota es ajustada en la distancia (el mejor recorrido de un vehículo está entre 122 y 124 cuadras), pero floja en el makespan cuando hay varias rutas. Por eso el rango es ancho, y por eso la evidencia que más pesa es que métodos independientes llegan al mismo número.
