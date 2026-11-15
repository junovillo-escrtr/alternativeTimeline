# Línea de Tiempo Alternativa — v0.9.13

Simulador geopolítico e histórico para crear escenarios por fechas y desarrollar campañas alternativas.

## Estado de la versión

La v0.9.13 parte de la v0.9.12 y se centra en rendimiento cartográfico, carga correcta de fronteras, documentación y formalización del intercambio JSON.

### Cambios de v0.9.13
- La cartografía TopoJSON se descomprime y reconstruye en un Web Worker cuando el navegador lo permite. Se mantiene un decodificador de reserva.
- Los datos de fronteras se cargan bajo demanda mediante `border-data-loader.js`, cuando se construye la vista territorial.
- El filtrado de fronteras se procesa por lotes para ceder el hilo principal.
- Se documentan propósito y arquitectura en `docs/`.
- Se publican esquemas JSON para escenarios, partidas y órdenes de turno en `schemas/`.
- Las exportaciones nuevas incluyen `schemaVersion: "1.0.0"`; los archivos anteriores sin versión siguen siendo aceptados.
- La vista política sigue agrupando las provincias de cada propietario en una feature MultiPolygon sin fronteras provinciales interiores visibles. La selección continúa apoyándose en el índice espacial provincial original.

## Funcionalidades
- Creador de escenarios con múltiples fechas, países, capitales y asignación provincial.
- Importación de GeoJSON externo.
- Mapa de partida con superficies políticas agregadas y fronteras entre propietarios.
- Turnos JSON, cambios territoriales, creación de entidades políticas, cronología e instituciones.
- Gestión inicial de concesiones, competencias, instituciones, terceros y delimitación urbana esquemática.

## Documentación
- [Descripción del proyecto](docs/PROJECT_OVERVIEW.md)
- [Arquitectura y módulos](docs/ARCHITECTURE.md)
- [Contrato JSON y compatibilidad](docs/JSON_CONTRACT.md)

## Estructura principal
- `index.html`: interfaz y puntos de montaje.
- `css/`: estilos.
- `data/`: topología y límites Earth3.
- `js/core/`: cargadores y utilidades.
- `js/workers/`: tareas cartográficas fuera del hilo principal.
- `js/modules/`: editor, partida y concesiones.
- `schemas/`: contratos JSON.

## Cartografía y rendimiento
Las provincias son la fuente de verdad. La vista política agrega sus geometrías en superficies multipoligonales por entidad, sin ejecutar una unión booleana de miles de anillos. Los rellenos agregados no dibujan trazos interiores; los límites políticos se calculan desde la topología de vecinos y se muestran entre propietarios distintos y en la costa.

El renderizador sigue siendo Leaflet Canvas. WebGL no se activa de forma especulativa: requiere una prueba específica con `CRS.Simple`, zoom, desplazamiento, islas, geometrías multipartes y selección provincial. La descompresión y reconstrucción TopoJSON sí se traslada a un Web Worker cuando está disponible.

Las métricas se muestran en la consola con el prefijo `[LTA rendimiento]`.

## Requisitos y ejecución
- Navegador moderno.
- Conexión a Internet para Leaflet y Google Fonts desde CDN.
- Se recomienda servir la carpeta mediante HTTP local. Algunos navegadores restringen Web Workers al abrir `index.html` con `file://`; en ese caso se utiliza el decodificador de reserva en el hilo principal.

## Compatibilidad
Los escenarios y partidas anteriores sin `schemaVersion` siguen siendo aceptados. Las nuevas exportaciones incorporan la versión del contrato JSON `1.0.0`. Consulta `docs/JSON_CONTRACT.md` antes de crear generadores de órdenes.
