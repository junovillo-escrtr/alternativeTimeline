# Arquitectura del proyecto

## Estructura

```text
/
├── index.html
├── README.md
├── css/                 # Estilos base, tema, instituciones y ajustes
├── data/                # TopoJSON y fronteras Earth3 integradas
├── docs/                # Documentación funcional y técnica
├── schemas/             # JSON Schema versionados
└── js/
    ├── core/
    │   ├── module-loader.js
    │   ├── map-data-loader.js
    │   ├── border-data-loader.js
    │   └── map-helpers.js
    ├── workers/
    │   └── map-data-worker.js
    └── modules/
        ├── scenario-editor.js
        ├── game.js
        └── concessions.js
```

## Responsabilidades

### Entrada y estilos
- `index.html`: pantallas, modales, puntos de montaje y orden de carga.
- `css/`: estilos base, tema visual, componentes institucionales y ajustes.

### Núcleo (`js/core`)
- `module-loader.js`: carga scripts clásicos bajo demanda y evita solicitudes duplicadas.
- `map-data-loader.js`: expone `window.__LTA_LOAD_MAP_DATA()`, cachea la promesa y coordina el trabajador cartográfico con un decodificador de reserva.
- `border-data-loader.js`: expone `window.__LTA_LOAD_BORDER_DATA()` y carga los segmentos de frontera una sola vez.
- `map-helpers.js`: índice espacial provincial, consulta punto-en-polígono, límites del mundo y saneamiento de escenarios.

### Trabajador (`js/workers`)
- `map-data-worker.js`: importa la topología comprimida, descomprime, parsea y reconstruye GeoJSON fuera del hilo principal.

### Módulos (`js/modules`)
- `scenario-editor.js`: escenarios, fechas, países y propiedad provincial.
- `game.js`: partida, mapa territorial, fronteras, turnos, entidades, cronología e instituciones.
- `concessions.js`: directorio, acuerdos, competencias, finanzas descriptivas, instituciones y plano urbano esquemático.

## Modelo cartográfico
1. Las provincias terrestres se reconstruyen desde TopoJSON conservando IDs y propiedades.
2. `ownership` asigna cada provincia a una entidad.
3. La vista territorial agrupa los componentes Polygon/MultiPolygon de cada propietario en una feature MultiPolygon por entidad y otra para territorio sin propietario.
4. El relleno agregado se dibuja sin trazo. Las fronteras se calculan desde la topología de vecinos y solo se conservan límites tierra-mar y límites entre propietarios distintos.
5. La selección usa el índice espacial provincial original.

No se realiza una unión booleana de anillos: la agregación multipoligonal evita operaciones topológicas costosas y los bloqueos anteriores.

## Rendimiento
- TopoJSON comprimido.
- Descompresión y reconstrucción en Web Worker, con fallback.
- Carga diferida de fronteras.
- Filtrado de fronteras por lotes.
- Índice espacial provincial.
- Caché limitada de superficies territoriales.
- Métricas en consola bajo `[LTA rendimiento]`.

## Dependencias
Leaflet 1.9.4 y Google Fonts desde CDN. Los módulos funcionales actuales son scripts clásicos. Web Workers y DecompressionStream se usan cuando están disponibles.
