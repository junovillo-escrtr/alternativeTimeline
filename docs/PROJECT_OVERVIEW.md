# Línea de Tiempo Alternativa

## Propósito
Línea de Tiempo Alternativa (LTA) es un simulador geopolítico e histórico para construir escenarios por fechas y desarrollar campañas alternativas. El usuario define países, dirigentes, gobiernos, capitales y control provincial; durante la partida puede modificar el mundo mediante turnos y órdenes JSON.

## Principios
- Las provincias individuales y sus identificadores se conservan como fuente territorial de verdad.
- En la vista política, cada entidad se dibuja como una superficie multipoligonal sin fronteras provinciales internas visibles.
- Las fronteras entre propietarios distintos se dibujan por separado.
- La selección se resuelve contra el índice espacial provincial original.
- Los escenarios y partidas anteriores siguen siendo importables.
- Los cambios de rendimiento no deben alterar geometrías, identificadores ni comportamiento.

## Funcionalidades actuales
- Creador de escenarios con fechas, naciones, colores, banderas, escudos, líderes, gobiernos, capitales y asignación provincial.
- Importación de cartografía GeoJSON externa.
- Cartografía Earth3 integrada, almacenada como TopoJSON comprimido y adaptada a GeoJSON para Leaflet.
- Partidas con selección de país, cronología, eventos, guardado local y exportación/importación JSON.
- Cambios territoriales, indicadores, entidades políticas creadas mediante órdenes y módulos institucionales.
- Directorio y gestión inicial de concesiones, con competencias negociadas, datos económicos descriptivos, instituciones, terceros y delimitación urbana esquemática.

## Límites conocidos
- Leaflet Canvas sigue siendo el renderizador. WebGL requiere una evaluación específica con CRS.Simple y la geometría Earth3.
- El plano urbano de concesiones es esquemático, no cartografía urbana histórica.
- Influencia marítima, rutas comerciales y control estratégico aún no tienen simulación completa.
- No hay todavía simulación económica, diplomática o social integral para las concesiones.

## Ejecución
Abrir `index.html` en un navegador moderno con conexión a Internet para cargar Leaflet desde CDN. Se recomienda servir la carpeta mediante HTTP local, especialmente para habilitar Web Workers en todos los navegadores.
