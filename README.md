# Línea de Tiempo Alternativa — v0.9.12

## Novedades de v0.9.11 — optimización de cartografía

### TopoJSON interno sin romper el creador de escenarios GeoJSON
- La cartografía Earth3 integrada pasa de almacenarse como GeoJSON comprimido a una topología TopoJSON comprimida.
- Se conservan las 12.103 provincias terrestres, sus identificadores y propiedades, las 1.789 provincias oceánicas excluidas y las geometrías Polygon/MultiPolygon.
- La topología contiene 64.931 arcos. Los tramos de frontera que coinciden exactamente se comparten entre provincias; no se fuerza una coincidencia artificial en los segmentos cuya geometría original no coincide.
- El tamaño comprimido de la cartografía pasa de 4.792.349 bytes a 2.334.210 bytes (reducción aproximada del 51%). El contenido descomprimido pasa de 26.488.122 a 14.301.201 bytes (reducción aproximada del 46%).
- Se incluye un adaptador TopoJSON → GeoJSON al cargar el mapa. Esto es deliberado: el resto de la aplicación y Leaflet siguen trabajando con objetos GeoJSON, por lo que no hay que reescribir el creador de escenarios, la selección provincial, las órdenes JSON ni el modelo `ownership`.
- **El creador de escenarios sigue aceptando GeoJSON** mediante su botón «Importar GeoJSON». No se exige convertir los mapas que genere ni cambiar el formato de los escenarios guardados.
- La carga de la cartografía base y de los límites nativos se hace de forma diferida: no se descomprimen hasta que se abre la vista de mapa correspondiente.

### Rendimiento y selección
- Se guardan cajas delimitadoras por provincia dentro de la topología y se transfieren al objeto GeoJSON reconstruido. El índice espacial puede construir sus celdas sin volver a recorrer todos los vértices para calcular cada caja.
- El índice espacial separa las geometrías con extensiones excepcionalmente grandes para evitar que una provincia ocupe cientos o miles de celdas de la cuadrícula.
- El hit-testing del cursor del creador de escenarios se limita a una comprobación por fotograma de animación, en lugar de ejecutarse por cada evento `mousemove` recibido.
- Las fronteras políticas se representan como una única capa `L.Polyline` de Canvas, en lugar de crear una subcapa GeoJSON por cada tramo. Se mantiene la selección de entidades a través del índice provincial.
- Se añaden mediciones de carga, parseo, decodificación, preparación del mapa y fronteras en la consola del navegador, bajo el prefijo `[LTA rendimiento]`.

### Qué no se ha cambiado todavía
- El renderizador sigue siendo **Leaflet Canvas**, no WebGL. La conversión a WebGL no se ha activado porque el mapa usa el sistema de coordenadas local `CRS.Simple` de Age of History 3 y hay que validar una solución que conserve correctamente el zoom, el desplazamiento, los polígonos multiparte y la selección. Primero se reducen los datos y las capas redundantes y se dejan mediciones para comprobar el cuello de botella real.
- El adaptador reconstruye objetos GeoJSON en memoria para mantener compatibilidad con el código actual. Por tanto, esta versión aprovecha TopoJSON para reducir almacenamiento, transferencia, parseo y cálculo de cajas, pero todavía no dibuja directamente los arcos TopoJSON en la GPU.
- La importación de GeoJSON externo del creador de escenarios continúa funcionando como antes; esos archivos se procesan como GeoJSON y no se convierten automáticamente a TopoJSON.
- No se ha realizado una prueba visual interactiva integral en un navegador real. Las mediciones incluidas en la consola permitirán comparar el rendimiento en tu equipo.

### Validaciones de esta entrega
- Conversión de las 12.103 geometrías y comprobación de los 13.345 anillos: reconstrucción exacta de todos los anillos (se permite el cambio de punto inicial del anillo, que no altera la geometría).
- Se mantienen los 12.103 identificadores terrestres, los 1.789 IDs oceánicos y las propiedades originales.
- El TopoJSON comprimido ocupa aproximadamente un 54% menos que el GeoJSON comprimido anterior.
- Pruebas de referencia en Node.js: el GeoJSON anterior necesitó aproximadamente 0,75–0,79 s para inflarse y parsearse; la ruta TopoJSON (inflado, parseo y reconstrucción GeoJSON) osciló aproximadamente entre 0,5 y 0,9 s según la ejecución. La reducción de tamaño sí es consistente, pero el tiempo final depende del navegador y del equipo. Se restauran seis coordenadas decimales excepcionales para conservar también esos valores originales. Son mediciones de entorno de desarrollo, no una garantía de tiempos en todos los equipos.
- Sintaxis de los siete bloques JavaScript inline comprobada con Node.js.
- Integridad del ZIP y estructura de los JSON de ejemplo comprobadas.

---


## Novedades de v0.9.10

### Mapa territorial: superficies sin fronteras provinciales interiores
- Se mantiene una única feature `MultiPolygon` de relleno por entidad política y otra para el Territorio Baldío.
- Las superficies se dibujan sin trazo y sin interacción individual por provincia; así desaparecen las líneas provinciales interiores y se evita que Leaflet haga hit-testing sobre geometrías enormes.
- La selección de una entidad se resuelve mediante el índice espacial de provincias: al hacer clic se identifica la provincia y se selecciona su propietario.
- Se incorpora la topología de límites nativa de Age of History 3 (`ProvinceNeighboringProvinces`). Solo se dibujan las fronteras entre propietarios distintos y los límites tierra-mar; las fronteras entre provincias del mismo propietario se omiten.
- Los límites se agrupan en una única capa `MultiLineString` y se cargan desde datos comprimidos integrados en el HTML, sin peticiones externas.
- Se aplica una simplificación visual muy conservadora (`smoothFactor: 0.3`) en la capa de partida. El mapa provincial del editor mantiene sus geometrías originales.

**Nota técnica importante:** esta versión resuelve la continuidad visual y la selección por entidad, pero no realiza una unión booleana topológica de los polígonos provinciales. Internamente, cada entidad sigue conteniendo sus polígonos provinciales como componentes de un único `MultiPolygon`; las líneas interiores se eliminan en la representación y las fronteras políticas se trazan por separado usando la topología original del juego. Esto evita repetir los intentos de disolución geométrica que provocaron bloqueos y errores.

## Novedades de esta versión

### Mapa territorial: corrección de bloqueo al construir las entidades
- Se elimina la dependencia de `polygon-clipping` para construir el mapa político.
- La aplicación agrupa directamente los componentes Polygon/MultiPolygon de las provincias de cada entidad en una sola feature GeoJSON MultiPolygon por entidad, y hace lo mismo con el Territorio Baldío.
- No se ejecuta una unión booleana de miles de anillos, evitando el error `Infinite loop when putting segment endpoints in a priority queue`.
- Las fronteras interiores de provincias de una misma entidad no se dibujan con un color de borde distinto: el trazo utiliza el mismo color que el relleno.
- El procesamiento cede periódicamente el hilo para mantener la interfaz receptiva.
- Nota técnica: las provincias se agrupan en una única feature multipoligonal, pero sus anillos no se disuelven topológicamente. La continuidad visual se consigue con el estilo de dibujo; las geometrías provinciales originales permanecen intactas.

### Creación de entidades políticas mediante JSON
- Se elimina el acceso a la creación manual de administraciones territoriales desde la interfaz.
- El motor de simulación puede ordenar la creación de una o varias entidades mediante la propiedad `entityCreations` del JSON de turno.
- Al aplicar el turno, la aplicación muestra un panel de delimitación sobre el mapa. Las provincias se seleccionan manualmente haciendo clic; otro clic las deselecciona.
- La interfaz muestra el nombre y tipo de entidad definidos por el JSON. El color puede venir indicado en el JSON o ajustarse durante la delimitación.
- Se puede añadir bandera y escudo mediante URL o subir imágenes locales (máximo 5 MB por imagen).
- Al confirmar, la nueva entidad se incorpora a `nations` como entidad política, recibe las provincias seleccionadas en `ownership` y queda vinculada a su entidad superior mediante `overlord`.
- Se pueden procesar varias creaciones en secuencia dentro del mismo turno.
- Si se indica `overlord` o `parentEntityId`, solo se pueden seleccionar provincias que pertenezcan a esa entidad superior. La entidad superior debe existir en la fecha activa o haberse creado antes en la misma secuencia.

#### Esquema de `entityCreations`

```json
{
  "turn": 1,
  "entityCreations": [
    {
      "id": "VIR-NUEVA-ESPANA",
      "name": "Virreinato de Nueva España",
      "entityType": "viceroyalty",
      "status": "non",
      "overlord": "ESP",
      "leader": "",
      "government": "Virreinato",
      "color": "#b79a68",
      "flag": "",
      "coat": ""
    }
  ]
}
```

Campos:
- `id`: identificador opcional y único. Si se omite, la aplicación genera uno.
- `name`: obligatorio.
- `entityType` (o `type`): tipo descriptivo, por ejemplo `viceroyalty`, `governorate`, `colony`, `protectorate`, `autonomous_region` o cualquier otro texto.
- `status`: `sovereign`, `semi` o `non`. Si se omite, se crea como `non`.
- `overlord` (o `parentEntityId`): identificador de la entidad superior. Si se omite, no se establece subordinación.
- `leader`, `government`, `color`, `flag`, `coat`, `portrait`, `description` y `attributes`: datos opcionales.
- Las provincias **no se incluyen en el JSON**: se seleccionan manualmente en el mapa durante la resolución de la orden.

El archivo `ejemplo-orden-entidad-v0.9.5.json` contiene un ejemplo aislado de esta orden. Sustituye `ESP` por el identificador real de la entidad superior en tu escenario.

### Cambio manual de color
- En la ficha lateral del país del jugador y de los Estados subordinados aparece un pequeño selector de color junto al nombre.
- El cambio se refleja inmediatamente en el mapa y se conserva al guardar o exportar la partida.

### Unificación visual
- Se normalizan fondos, paneles, bordes, campos, botones, pestañas y estados activos con el lenguaje carbón/dorado de la pantalla principal de partida.
- Se mantiene la personalidad de componentes editoriales específicos, como el árbol dinástico y el hemiciclo, sin imponerles una estructura genérica.
- Se aplica un tema oscuro/dorado a las barras de desplazamiento verticales y horizontales, incluidas las pistas, controles y botones de flecha cuando el navegador permite representarlos.
- La pantalla principal de partida mantiene su estructura y distribución.

## Cartografía: recuperación y mejora del mapa
- Se reconstruyen las 12.103 provincias terrestres a partir de los puntos originales de `map/Earth3/data/ProvincePoints/` del mapa Earth3.
- Se recupera el detalle perdido por la simplificación anterior. La simplificación pasa a ser adaptativa: las provincias pequeñas y los componentes insulares pequeños conservan su geometría original; las partes grandes se simplifican con una tolerancia moderada.
- Se mantienen las 12.103 provincias terrestres, sus identificadores, propiedades, vecinos, anclas de nombres y el registro de 1.789 provincias oceánicas excluidas.
- En el creador de escenarios se refuerza el contorno provincial con una línea más oscura y gruesa.
- Se reduce la simplificación adicional que Leaflet aplicaba al dibujar las geometrías.
- En el mapa de partida, los modos político y administrativo utilizan el mismo color en el contorno y el relleno de cada entidad para ocultar visualmente las fronteras provinciales interiores. El modo provincial conserva los contornos individuales.
- La selección y los datos siguen basándose en las provincias originales: al hacer clic, se identifica la provincia y se selecciona su entidad propietaria.

## Qué no cambia en esta versión
- No se ha añadido una operación topológica de disolución que convierta todas las provincias de un país en un único objeto geométrico almacenado. La continuidad visual de los modos político y administrativo se consigue ocultando los bordes interiores; las provincias se conservan como fuente de verdad.
- Los modos temáticos de influencia marítima, rutas comerciales, control estratégico y concesiones siguen siendo vistas pendientes, sin datos simulados.

## Cómo abrir
1. Descomprime el ZIP.
2. Abre `index.html` con Chrome, Edge o Firefox.
3. La aplicación usa Leaflet desde un CDN, por lo que necesita conexión a Internet para cargar la biblioteca cartográfica.

No requiere instalar programas ni configurar un servidor.

## Compatibilidad y datos
- Se mantienen los identificadores provinciales y el modelo territorial `ownership` y `capitals`.
- Las entidades creadas por turno se almacenan en la colección existente `nations`, con el campo adicional `entityType` y las propiedades habituales de Estado (`status`, `overlord`, `color`, `flag`, `coat`, etc.).
- Los escenarios y partidas anteriores siguen siendo compatibles; los campos nuevos son opcionales.
- Las antiguas propiedades `administrations` no se eliminan automáticamente de partidas antiguas, pero ya no existe un botón para crear administraciones mediante el flujo anterior.

## Comprobaciones de esta entrega
- Geometrías reconstruidas para las 12.103 provincias terrestres desde los puntos originales.
- Las 12.103 geometrías son Polygon o MultiPolygon válidos; se mantienen 477 MultiPolygon.
- Se comprueba que no se han incluido provincias oceánicas.
- Se mantienen los identificadores provinciales y las propiedades de los datos de partida.
- Se comprueba la recuperación de geometrías que habían quedado muy simplificadas (por ejemplo, la provincia 181 pasa de 6 a 14 vértices).
- Sintaxis de todos los bloques JavaScript inline comprobada con Node.js.
- Estructura de los JSON de ejemplo validada.
- Integridad del ZIP comprobada tras empaquetar.
- No se ha completado una prueba visual e interactiva integral en navegador; por tanto, la apariencia final y el flujo completo deben verificarse al abrir la aplicación.


## v0.9.7 — Mapa de partida por entidades y fondo geográfico

### Nuevo mapa de partida
- Se incorpora `earth3-background.png`, un fondo geográfico estático generado a partir de las 32 teselas originales de `Earth3/background/main` (cuadrícula 8 × 4). Se compone en el sistema de coordenadas Earth3 y se integra como una única imagen PNG de 8.933 × 4.300 píxeles.
- El fondo no tiene interacción: únicamente aporta relieve, costas y contexto visual.
- La capa interactiva se separa del fondo y se genera agrupando las provincias por entidad política.
- En vista política se construye una geometría disuelta por Estado/entidad y otra geometría para `Territorio Baldío`, que agrupa todas las provincias sin propietario.
- En vista administrativa se disuelven las provincias de cada administración y se agrupan por Estado las provincias restantes.
- Las geometrías disueltas pueden ser `MultiPolygon`, de modo que una entidad mantiene una sola identidad aunque tenga islas o territorios separados.
- La vista provincial conserva las 12.103 provincias originales y se utiliza también temporalmente al delimitar entidades creadas por JSON o asignar provincias a administraciones.
- La selección política se realiza sobre las geometrías agrupadas; durante la selección territorial se utiliza el índice provincial original.
- Las geometrías agrupadas se guardan en caché durante la sesión y se regeneran cuando cambia la distribución de propietarios o administraciones. Los cambios de color no requieren volver a disolver el mapa.
- La unión geométrica utiliza `polygon-clipping` 0.15.7 desde CDN. Si no se puede cargar la biblioteca, la aplicación muestra la vista provincial como alternativa y comunica el problema; Leaflet ya requiere conexión a Internet en las versiones anteriores.
- Los rellenos políticos son parcialmente transparentes para conservar visible la textura geográfica del fondo, especialmente en microterritorios.

### Sobre las islas y microterritorios
- El fondo original recupera la silueta geográfica y el detalle visual que se perdía al representar el mapa únicamente con los polígonos de provincia.
- Los contornos interactivos siguen dependiendo de las coordenadas vectoriales incluidas en `ProvincePoints`. Algunas provincias extremadamente pequeñas tienen muy pocos vértices en la fuente original; el PNG permite recuperar visualmente la costa, pero no inventa vértices ni modifica artificialmente esos límites. Para una corrección vectorial exacta de cada microterritorio habría que contrastar individualmente sus contornos con los datos `ProvincePoints_Cut` y validar su correspondencia con los IDs provinciales.

### Compatibilidad y dependencias
- No se eliminan ni sustituyen provincias, IDs, vecinos, capitales ni asignaciones del escenario.
- El mapa del creador de escenarios permanece provincial. El fondo PNG y la disolución se aplican únicamente al mapa de partida.
- Se mantiene la estructura de guardado/importación de escenarios y partidas.
- Para abrir la aplicación siguen siendo necesarias conexión a Internet y disponibilidad de los CDN de Leaflet y polygon-clipping.


## v0.9.8 — Mapa territorial único y sin fondo PNG

### Cambios del mapa de partida
- Se elimina el PNG `earth3-background.png`: el mapa de partida utiliza exclusivamente las superficies GeoJSON, evitando desalineaciones entre imagen y vectores.
- Se elimina la separación entre las pestañas Político, Administrativo y Provincial. Se muestra una única vista «Territorial».
- La vista territorial dibuja una geometría por cada entidad política con provincias asignadas y una única geometría `MultiPolygon` para todo el `Territorio Baldío`, incluso si el resultado contiene un solo componente conectado.
- Las administraciones creadas como entidades políticas mediante órdenes JSON se representan igual que el resto de entidades, porque su territorio se determina mediante `ownership`.
- Las provincias originales permanecen disponibles para el creador de escenarios y para seleccionar territorio al resolver órdenes de creación. Durante esa selección se muestra temporalmente la capa provincial; no es la vista normal de la partida.
- La unión geométrica se procesa por lotes para evitar pasar miles de polígonos en una única operación.
- Si falla la unión, la aplicación muestra un error explícito; ya no cambia silenciosamente a mostrar miles de provincias como supuesto mapa político.
- Se conserva la selección de entidades al hacer clic sobre sus superficies.

### Limitación conocida
- Esta entrega parte de las geometrías ya incluidas en la v0.9.7. No se ha podido reconstruir ni verificar de nuevo la forma de microterritorios como Ceuta, Melilla, Gibraltar, Ibiza, Malta o Bahamas porque el ZIP recibido en esta conversación contiene la aplicación v0.9.7, pero no el archivo fuente `map.zip` de Age of History 3. Para corregir esas siluetas vectoriales hace falta volver a adjuntar el mapa original.

### Comprobaciones de v0.9.8
- Se comprueba la integridad del ZIP.
- Se comprueba la sintaxis de los bloques JavaScript inline con Node.js.
- Se comprueba que solo queda una pestaña territorial y que no se referencia el PNG de fondo.
- No se ha completado una prueba visual interactiva integral en navegador. La primera carga del mapa requiere conexión a Internet para Leaflet y `polygon-clipping`.


## Novedades de v0.9.12 — primera implementación de Concesiones

- Se incorpora una vista propia de Concesiones dentro de la partida, accesible desde el selector de modos del mapa.
- Se añade un directorio con filtros por potencia concesionaria, Estado anfitrión, estado y búsqueda de texto.
- Se pueden crear, editar y extinguir concesiones; se conservan sus datos en el objeto del escenario y se incluyen al guardar/exportar la partida.
- Cada concesión registra anfitrión, concesionario, ciudad, régimen, vigencia, competencias negociadas, presupuesto, contraprestaciones, presencia de terceros, instituciones y un historial básico.
- La seguridad y el orden público se muestran según las competencias concedidas; no se presuponen para todas las concesiones.
- Se añade una vista urbana individual con sectores seleccionables para delimitar áreas, además de gestión de terceros e instituciones.
- El número de concesiones no está limitado por una lista fija: se almacenan como registros dinámicos del escenario y pueden coexistir en una misma ciudad.

### Límites de esta primera implementación

- El ZIP original no contiene cartografía urbana de ciudades. Por eso, la vista de ciudad utiliza un **plano esquemático de sectores seleccionables**, expresamente identificado como provisional. No representa calles, manzanas ni límites históricos reales.
- La gestión y el almacenamiento de concesiones funcionan en la estructura de la partida, pero todavía no existe simulación económica, negociación diplomática automática ni cálculo de prestigio, influencia o tensión social.
- La vigencia temporal se registra por fechas y las concesiones futuras no aparecen hasta su fecha de inicio. La reconstrucción completa de estados históricos tras modificaciones sucesivas requerirá una fase posterior de historial basado en eventos.
- La pestaña se ha integrado como módulo JavaScript separado (`js/modules/concessions.js`) y utiliza una API acotada expuesta por el módulo de partida.
- Validación realizada en esta entrega: comprobación sintáctica de los scripts JavaScript con Node.js. No se ha podido completar una prueba interactiva integral en navegador en este entorno; conviene probar la apertura, creación, edición, guardado e importación en tu equipo.
