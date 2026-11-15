
window.__LTA_MAP_HELPERS=(()=>{
 const cellSize=192;
 function bboxOfGeometry(g){let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  const walk=a=>{if(!Array.isArray(a))return;if(a.length>=2&&typeof a[0]==='number'&&typeof a[1]==='number'){minX=Math.min(minX,a[0]);maxX=Math.max(maxX,a[0]);minY=Math.min(minY,a[1]);maxY=Math.max(maxY,a[1]);return;}for(const v of a)walk(v)};walk(g.coordinates);return [minX,minY,maxX,maxY];}
 function ringContains(x,y,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];const cross=(x-a[0])*(b[1]-a[1])-(y-a[1])*(b[0]-a[0]);
  if(Math.abs(cross)<1e-7&&x>=Math.min(a[0],b[0])-1e-7&&x<=Math.max(a[0],b[0])+1e-7&&y>=Math.min(a[1],b[1])-1e-7&&y<=Math.max(a[1],b[1])+1e-7)return true;
  if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))inside=!inside;
 }return inside;}
 function polygonContains(x,y,rings){if(!rings.length||!ringContains(x,y,rings[0]))return false;for(let i=1;i<rings.length;i++)if(ringContains(x,y,rings[i]))return false;return true;}
 function contains(f,x,y){const g=f.geometry;if(g.type==='Polygon')return polygonContains(x,y,g.coordinates);if(g.type==='MultiPolygon')return g.coordinates.some(poly=>polygonContains(x,y,poly));return false;}
 function buildIndex(features){
  const grid=new Map(),large=[];
  for(const f of features){
   const b=f.bbox||f.geometry?.bbox||bboxOfGeometry(f.geometry);if(!Number.isFinite(b[0]))continue;f.__ltaBBox=b;
   const x0=Math.floor(b[0]/cellSize),x1=Math.floor(b[2]/cellSize),y0=Math.floor(b[1]/cellSize),y1=Math.floor(b[3]/cellSize),count=(x1-x0+1)*(y1-y0+1);
   if(count>1200){large.push(f);continue;}
   for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++){const k=x+','+y;let a=grid.get(k);if(!a)grid.set(k,a=[]);a.push(f);}
  }
  function test(list,x,y){if(!list)return null;for(let i=list.length-1;i>=0;i--){const f=list[i],b=f.__ltaBBox;if(x>=b[0]-1e-6&&x<=b[2]+1e-6&&y>=b[1]-1e-6&&y<=b[3]+1e-6&&contains(f,x,y))return f;}return null;}
  return {hit(x,y){const hit=test(grid.get(Math.floor(x/cellSize)+','+Math.floor(y/cellSize)),x,y);return hit||test(large,x,y);}};
 }
 function worldBounds(data){const b=data?.bbox;if(!Array.isArray(b)||b.length!==4)return null;return [[b[1],b[0]],[b[3],b[2]]];}
 function sanitizeScenario(s){const ids=window.__LTA_OCEAN_IDS;if(!ids||!s?.dates)return 0;let removed=0;for(const st of Object.values(s.dates)){if(!st||!st.ownership)continue;for(const id of ids){if(Object.prototype.hasOwnProperty.call(st.ownership,id)){delete st.ownership[id];removed++;}}for(const [nid,cid] of Object.entries(st.capitals||{})){if(ids.has(Number(cid))||ids.has(String(cid)))delete st.capitals[nid];}}return removed;}
 return {buildIndex,worldBounds,sanitizeScenario};
})();
