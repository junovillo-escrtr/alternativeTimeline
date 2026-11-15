# Contrato JSON de Línea de Tiempo Alternativa

**Versión del contrato:** `1.0.0`  
**Esquemas:** carpeta `schemas/` (JSON Schema Draft 2020-12).

## Versionado y compatibilidad
- `schemaVersion` identifica el contrato, no la versión de la aplicación.
- Los documentos nuevos exportados declaran `schemaVersion: "1.0.0"`.
- Escenarios y partidas heredados sin versión se aceptan como formato legado.
- Añadir propiedades opcionales compatibles incrementa minor; correcciones compatibles incrementan patch; cambios incompatibles incrementan major.
- Los objetos de dominio permiten propiedades adicionales para no bloquear extensiones futuras.

## Escenario
Archivo: `schemas/scenario.schema.json`.

La raíz contiene `name` y `dates`. Cada fecha contiene `nations[]`, `ownership` (mapa provinceId → nationId), `capitals` (mapa nationId → provinceId), y opcionalmente `administrations[]` y `concessions[]`.

Los identificadores provinciales son cadenas opacas: no deben convertirse a números ni regenerarse.

## Partida
Archivo: `schemas/game.schema.json`.

Una partida referencia el escenario y registra `id`, `name`, `date`, `player`, `selected`, `turn`, `created`, `events[]` y datos opcionales de espionaje, indicadores, gobiernos, parlamentos, dinastías, fuerzas armadas y sociedad/cultura.

## Orden de turno
Archivo: `schemas/turn.schema.json`.

Puede contener `turn`, `date`, `name`, `metrics`, `subjectMetrics`, `countryMetrics`, `publicEstimates`, `territorialChanges[]`, `capitals`, `nationUpdates`, `dynasties`, `parliaments`, `governments`, `armedForces`, `societyCulture`, `events[]` y `entityCreations[]`.

Las provincias de una entidad creada no se incluyen en el JSON: se seleccionan manualmente durante la resolución de la orden.

## Reglas semánticas
- Indicadores normalizados: entre 0 y 100.
- `ownerId` debe identificar una entidad del estado activo, o ser null para liberar una provincia.
- Una entidad subordinada referencia a su superior mediante `overlord` o el alias heredado `parentEntityId`.
- `entityType` es descriptivo y extensible.
- Las concesiones no modifican automáticamente la propiedad provincial del Estado anfitrión.
- Las fechas se expresan como `AAAA`, `AAAA-MM` o `AAAA-MM-DD`.

Los ejemplos históricos existentes siguen siendo válidos aunque no incluyan `schemaVersion`.
