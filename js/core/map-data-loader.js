// Carga cartográfica fuera del hilo principal cuando el navegador admite Web Workers.
// Mantiene una ruta de reserva compatible con el decodificador anterior.
window.__LTA_MAP_DATA_PROMISE=null;
function ltaDecodeTopologyInMainThread(){
 return (async()=>{
  if(!('DecompressionStream' in window))throw new Error('Este navegador no admite la carga comprimida de la cartografía. Usa una versión reciente de Chrome, Edge, Firefox o Safari.');
  await window.LTA.loadScript('data/earth3-topology.js');
  const totalStart=performance.now(),encoded=window.__LTA_EARTH3_TOPOJSON_GZIP_BASE64;
  const binary=atob(encoded),bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  const inflateStart=performance.now();
  const raw=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const inflateMs=performance.now()-inflateStart,parseStart=performance.now();
  const topology=JSON.parse(new TextDecoder().decode(raw));
  const parseMs=performance.now()-parseStart,decodeStart=performance.now();
  if(topology.type!=='Topology'||!topology.objects?.provinces?.geometries)throw new Error('La topología integrada no tiene una colección provincial válida.');
  const tr=topology.transform||null,decodedArcs=topology.arcs.map(arc=>{if(!tr)return arc;let x=0,y=0;return arc.map(d=>{x+=d[0];y+=d[1];return [x*tr.scale[0]+tr.translate[0],y*tr.scale[1]+tr.translate[1]]})});
  const getArc=ref=>{const a=decodedArcs[ref<0?~ref:ref];return ref<0?a.slice().reverse():a};
  const stitch=refs=>{const out=[];for(const ref of refs){const a=getArc(ref);if(!out.length)out.push(...a);else out.push(...a.slice(1));}return out};
  const features=topology.objects.provinces.geometries.map(g=>({type:'Feature',id:g.id,properties:g.properties||{},bbox:g.bbox,geometry:{type:g.type,coordinates:g.type==='Polygon'?g.arcs.map(stitch):g.type==='MultiPolygon'?g.arcs.map(poly=>poly.map(stitch)):null}}));
  for(const [fi,qx,qy,x,y] of topology.coordinateOverrides||[]){const f=features[fi];if(!f)continue;const walk=a=>{if(!Array.isArray(a))return;if(a.length>=2&&typeof a[0]==='number'&&typeof a[1]==='number'){if(Math.round(a[0]*12)===qx&&Math.round(a[1]*12)===qy){a[0]=x;a[1]=y;}return;}for(const v of a)walk(v)};walk(f.geometry.coordinates);}
  const data={type:'FeatureCollection',name:topology.name,coordinateSystem:topology.coordinateSystem,source:topology.source,bbox:topology.bbox,oceanProvinceIds:topology.oceanProvinceIds||[],landProvinceCount:topology.landProvinceCount,oceanProvinceCount:topology.oceanProvinceCount,geometryQuality:topology.geometryQuality,features};
  window.__LTA_OCEAN_IDS=new Set(data.oceanProvinceIds||[]);
  console.info('[LTA rendimiento] Cartografía TopoJSON → GeoJSON (hilo principal)',{comprimidoBytes:bytes.length,descomprimidoBytes:raw.byteLength,provincias:features.length,arcos:decodedArcs.length,infladoMs:+inflateMs.toFixed(1),parseoTopoJSONMs:+parseMs.toFixed(1),decodificacionMs:+(performance.now()-decodeStart).toFixed(1),totalMs:+(performance.now()-totalStart).toFixed(1)});
  return data;
 })();
}
window.__LTA_LOAD_MAP_DATA=()=>{
 if(window.__LTA_MAP_DATA_PROMISE)return window.__LTA_MAP_DATA_PROMISE;
 window.__LTA_MAP_DATA_PROMISE=(async()=>{
  if(typeof Worker==='function'&&'DecompressionStream' in window){
   try{
    const started=performance.now();
    const data=await new Promise((resolve,reject)=>{
     const worker=new Worker('js/workers/map-data-worker.js');
     const finish=()=>worker.terminate();
     worker.onmessage=e=>{finish();if(e.data?.error)reject(new Error(e.data.error));else resolve(e.data?.data||e.data)};
     worker.onerror=e=>{finish();reject(new Error(e.message||'Falló el trabajador cartográfico.'))};
     worker.postMessage({type:'load'});
    });
    window.__LTA_OCEAN_IDS=new Set(data.oceanProvinceIds||[]);
    console.info('[LTA rendimiento] Cartografía preparada en Web Worker',{provincias:data.features?.length||0,totalMs:+(performance.now()-started).toFixed(1)});
    return data;
   }catch(err){console.warn('[LTA rendimiento] Web Worker no disponible; se utiliza el decodificador principal:',err)}
  }
  return ltaDecodeTopologyInMainThread();
 })();
 return window.__LTA_MAP_DATA_PROMISE;
};
