// Decodificación TopoJSON aislada del hilo principal.
self.onmessage=async()=>{
 try{
  if(!('DecompressionStream' in self))throw new Error('DecompressionStream no disponible en el trabajador.');
  importScripts('../../data/earth3-topology.js');
  const totalStart=performance.now(),encoded=self.__LTA_EARTH3_TOPOJSON_GZIP_BASE64;
  if(!encoded)throw new Error('No se han encontrado los datos TopoJSON integrados.');
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
  postMessage({data,metrics:{totalMs:performance.now()-totalStart,inflateMs,parseMs,decodeMs:performance.now()-decodeStart,compressedBytes:bytes.length,rawBytes:raw.byteLength,arcCount:decodedArcs.length}});
 }catch(error){postMessage({error:error?.message||String(error)})}
};
