
// ===== Módulo de concesiones v0.9.12: datos por fecha, directorio y plano urbano esquemático =====
const cvRoot=document.getElementById('concessionView');
let cvSelectedId=null,cvSectorSelection=null,cvEditing=false;
const cvEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cvId=()=>`con_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
const cvApi=window.__LTA_GAME_API;
const cvScenario=()=>cvApi?.getScenario?.();
const cvState=()=>{const sc=cvScenario();if(!sc)throw new Error('No hay un escenario activo.');if(!Array.isArray(sc.concessions))sc.concessions=[];return sc};
const cvDate=()=>String(cvApi?.getGame?.()?.date||'').slice(0,10);
const cvNormDate=v=>{const p=String(v||'').split('-');return p.length===1?p[0]+'-01-01':p.length===2?p[0]+'-'+p[1]+'-01':p.join('-')};
const cvName=(id)=>cvApi?.getGameState?.().nations.find(n=>String(n.id)===String(id))?.name||String(id||'No especificado');
const cvStatusLabel=s=>({active:'Activa',suspended:'Suspendida',negotiation:'En negociación',ended:'Extinguida'}[s]||s||'Sin estado');
const cvTypeLabel=s=>({urban:'Concesión urbana',commercial:'Concesión comercial',port:'Concesión portuaria',infrastructure:'Infraestructura',international:'Régimen internacional',other:'Otro régimen especial'}[s]||'Régimen especial');
function cvListData(){const now=cvNormDate(cvDate());return cvState().concessions.filter(c=>!c.startDate||cvNormDate(c.startDate)<=now)}
function cvFind(id){return cvListData().find(c=>c.id===id)}
function cvLog(c,description,type='modified'){if(!Array.isArray(c.history))c.history=[];c.history.push({date:cvDate(),type,description})}
function cvNationOptions(){
 const names=[...new Set((cvApi?.getGameState?.().nations||[]).map(n=>n.name).filter(Boolean))];
 document.getElementById('cvNations').innerHTML=names.map(n=>`<option value="${cvEsc(n)}"></option>`).join('');
}
function cvPopulateFilters(){
 const cs=cvListData(),admin=document.getElementById('cvFilterAdmin'),host=document.getElementById('cvFilterHost');
 const keepA=admin.value,keepH=host.value;
 const unique=(key)=>[...new Set(cs.map(c=>c[key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'es'));
 admin.innerHTML='<option value="">Todas</option>'+unique('concessionaire').map(v=>`<option>${cvEsc(v)}</option>`).join('');
 host.innerHTML='<option value="">Todos</option>'+unique('host').map(v=>`<option>${cvEsc(v)}</option>`).join('');
 admin.value=unique('concessionaire').includes(keepA)?keepA:'';
 host.value=unique('host').includes(keepH)?keepH:'';
}
function cvRenderDirectory(){
 const cs=cvListData(),q=(document.getElementById('cvSearch').value||'').trim().toLocaleLowerCase('es'),a=document.getElementById('cvFilterAdmin').value,h=document.getElementById('cvFilterHost').value,s=document.getElementById('cvFilterStatus').value;
 const filtered=cs.filter(c=>(!q||[c.name,c.city,c.host,c.concessionaire].some(v=>String(v||'').toLocaleLowerCase('es').includes(q)))&&(!a||c.concessionaire===a)&&(!h||c.host===h)&&(!s||c.status===s));
 document.getElementById('cvCount').textContent=filtered.length+' / '+cs.length;
 const now=cvNormDate(cvDate()),active=cs.filter(c=>c.status==='active'&&(!c.endDate||cvNormDate(c.endDate)>=now)).length,hosts=new Set(cs.map(c=>c.host)).size,third=cs.reduce((n,c)=>n+(c.thirdPartyPresence||[]).length,0);
 document.getElementById('cvStats').innerHTML=`<div class="cv-stat"><small>Concesiones registradas</small><strong>${cs.length}</strong></div><div class="cv-stat"><small>Activas</small><strong>${active}</strong></div><div class="cv-stat"><small>Estados anfitriones</small><strong>${hosts}</strong></div><div class="cv-stat"><small>Presencias de terceros</small><strong>${third}</strong></div>`;
 document.getElementById('cvWorldSummary').textContent=cs.length?`${cs.length} concesión(es) registradas para ${cvDate()||'esta fecha'}. Cada mapa urbano se abre por separado.`:'Todavía no hay concesiones para esta fecha. Puedes crear la primera cuando exista un acuerdo.';
 const list=document.getElementById('cvList');
 if(!filtered.length){list.innerHTML=`<div class="cv-empty">${cs.length?'No hay resultados con esos filtros.':'No existen concesiones en esta fecha.<br>Utiliza «Nueva concesión» para registrar una.'}</div>`;return}
 list.innerHTML=filtered.map(c=>`<button class="cv-item" data-c-action="open" data-id="${cvEsc(c.id)}"><span class="cv-item-mark"></span><span class="cv-item-copy"><b>${cvEsc(c.name||'Concesión sin nombre')}</b><small>${cvEsc(c.city||'Ciudad no definida')} · ${cvEsc(c.host||'Anfitrión no definido')}</small><small>Administrada por ${cvEsc(c.concessionaire||'Sin asignar')}</small></span><span class="cv-pill">${cvEsc(cvStatusLabel(c.status))}</span></button>`).join('');
}
const cvSectors=[
 {id:'sector-1',name:'Sector 1',points:'72,65 238,48 275,142 132,171'},
 {id:'sector-2',name:'Sector 2',points:'238,48 420,72 399,171 275,142'},
 {id:'sector-3',name:'Sector 3',points:'420,72 590,45 625,155 399,171'},
 {id:'sector-4',name:'Sector 4',points:'132,171 275,142 310,276 155,302'},
 {id:'sector-5',name:'Sector 5',points:'275,142 399,171 445,290 310,276'},
 {id:'sector-6',name:'Sector 6',points:'399,171 625,155 605,292 445,290'},
 {id:'sector-7',name:'Sector 7',points:'155,302 310,276 350,405 95,420'},
 {id:'sector-8',name:'Sector 8',points:'310,276 445,290 605,292 555,420 350,405'}
];
function cvRenderDetail(){
 const c=cvFind(cvSelectedId);if(!c){cvSelectedId=null;cvRender();return}
 const selected=Array.isArray(c.urbanAreas)?c.urbanAreas:[];
 const third=c.thirdPartyPresence||[],inst=c.institutions||[];
 const comp=c.competencies||{},fin=c.finance||{};
 document.getElementById('cvDirectory').style.display='none';
 const d=document.getElementById('cvDetail');d.style.display='flex';
 document.getElementById('cvHeading').textContent=c.name||'Concesión';
 document.getElementById('cvSubtitle').textContent=`${c.city||'Ciudad sin definir'} · ${c.host||'Anfitrión'} · Administrada por ${c.concessionaire||'Sin asignar'}`;
 const sectors=cvSectors.map(s=>`<g data-sector="${s.id}" style="cursor:pointer"><polygon class="cv-sector ${selected.includes(s.id)?'selected':''}" points="${s.points}"></polygon><text class="cv-sector-label" x="${s.id==='sector-1'?145:s.id==='sector-2'?320:s.id==='sector-3'?505:s.id==='sector-4'?210:s.id==='sector-5'?355:s.id==='sector-6'?510:s.id==='sector-7'?225:450}" y="${s.id==='sector-1'?115:s.id==='sector-2'?110:s.id==='sector-3'?110:s.id==='sector-4'?240:s.id==='sector-5'?230:s.id==='sector-6'?235:s.id==='sector-7'?365:360}">${s.name}</text></g>`).join('');
 d.innerHTML=`
 <div class="cv-detail-top"><button class="cv-back" data-c-action="back">← Directorio mundial</button><span class="cv-pill">${cvEsc(cvStatusLabel(c.status))}</span><span class="cv-pill">${cvEsc(cvTypeLabel(c.type))}</span><span style="flex:1"></span><button class="cv-btn" data-c-action="edit" data-id="${cvEsc(c.id)}">Editar acuerdo</button><button class="cv-btn danger" data-c-action="delete" data-id="${cvEsc(c.id)}">${c.status==='ended'?'Eliminar registro':'Extinguir concesión'}</button></div>
 <div class="cv-detail-grid">
  <div class="cv-panel"><div class="cv-panel-head"><b>Plano urbano · ${cvEsc(c.city||'Ciudad')}</b><span class="cv-pill">${selected.length} sectores delimitados</span></div><div class="cv-citymap"><svg viewBox="0 0 700 470" role="img" aria-label="Plano urbano esquemático con sectores seleccionables"><rect width="700" height="470" fill="#d8d1c1"/><g stroke="#b0a894" stroke-width="13" fill="none" opacity=".8"><path d="M0 90 L700 30 M0 220 L700 185 M0 355 L700 330 M110 0 L180 470 M330 0 L365 470 M540 0 L515 470"/></g><g stroke="#eee8d9" stroke-width="5" fill="none"><path d="M0 90 L700 30 M0 220 L700 185 M0 355 L700 330 M110 0 L180 470 M330 0 L365 470 M540 0 L515 470"/></g>${sectors}<g fill="#a79d89" opacity=".65"><rect x="22" y="20" width="28" height="22"/><rect x="630" y="380" width="42" height="25"/><rect x="20" y="430" width="34" height="18"/></g></svg><div class="cv-map-note">Plano esquemático de sectores · selecciona los polígonos para delimitar la concesión</div></div><div class="cv-panel-body"><div class="cv-hint">La cartografía urbana real de esta ciudad todavía no está incluida en el ZIP original. Este plano es una superficie de trabajo esquemática para probar la selección de áreas; no representa calles ni límites históricos reales.</div></div></div>
  <div class="cv-side-stack">
   <div class="cv-info-card"><h3>Régimen y jurisdicción</h3><div class="cv-kv"><span>Estado anfitrión</span><b>${cvEsc(c.host)}</b></div><div class="cv-kv"><span>Concesionario</span><b>${cvEsc(c.concessionaire)}</b></div><div class="cv-kv"><span>Entrada en vigor</span><b>${cvEsc(c.startDate||'No indicada')}</b></div><div class="cv-kv"><span>Finalización</span><b>${cvEsc(c.endDate||'Indefinida')}</b></div><div class="cv-kv"><span>Administración civil</span><b>${comp.civilAdministration?'Concesionario':'Anfitrión / según acuerdo'}</b></div><div class="cv-kv"><span>Seguridad y orden</span><b>${comp.police||comp.publicOrder?'Competencias concedidas':'Estado anfitrión'}</b></div><div class="cv-kv"><span>Tribunales</span><b>${comp.courts?'Concesionario':'No concedidos'}</b></div><div class="cv-kv"><span>Aduanas</span><b>${comp.customs?'Concedidas':'No concedidas'}</b></div></div>
   <div class="cv-info-card"><h3>Autonomía económica</h3><div class="cv-kv"><span>Presupuesto propio</span><b>${fin.independentBudget?'Sí':'No'}</b></div><div class="cv-kv"><span>Presupuesto</span><b>${Number(fin.budget||0).toLocaleString('es-ES')} u.</b></div><div class="cv-kv"><span>Contraprestación</span><b>${cvEsc(({none:'Ninguna',fixed:'Canon fijo',percentage:'Porcentaje',negotiated:'Según acuerdo'}[fin.hostPaymentType])||'Sin definir')}</b></div><div class="cv-kv"><span>Valor pactado</span><b>${cvEsc(fin.hostPaymentValue||'—')}</b></div></div>
   <div class="cv-info-card"><h3>Presencia de terceros</h3><div class="cv-tags">${third.length?third.map((x,i)=>`<span class="cv-tag">${cvEsc(x.name)} · ${cvEsc(x.type)} <button class="cv-back" style="padding:1px 5px;margin-left:4px" data-c-action="remove-third" data-index="${i}">×</button></span>`).join(''):'<span class="cv-hint">Sin presencia extranjera registrada.</span>'}</div><form class="cv-inline-form" id="cvThirdForm"><input name="name" placeholder="País / empresa / entidad" required><select name="type"><option>Embajada</option><option>Consulado</option><option>Empresa</option><option>Banco</option><option>Universidad</option><option>Institución cultural</option><option>Asociación</option><option>Otra</option></select><button class="cv-btn" type="submit">Añadir</button></form></div>
   <div class="cv-info-card"><h3>Instituciones y edificios</h3><div class="cv-tags">${inst.length?inst.map((x,i)=>`<span class="cv-tag">${cvEsc(x.name)} · ${cvEsc(x.type)} <button class="cv-back" style="padding:1px 5px;margin-left:4px" data-c-action="remove-inst" data-index="${i}">×</button></span>`).join(''):'<span class="cv-hint">No hay instituciones registradas.</span>'}</div><form class="cv-inline-form" id="cvInstForm"><input name="name" placeholder="Nombre de la institución" required><select name="type"><option>Administración</option><option>Policía</option><option>Tribunal</option><option>Puerto</option><option>Ferrocarril</option><option>Escuela</option><option>Universidad</option><option>Museo</option><option>Hospital</option><option>Banco</option><option>Mercado</option><option>Otra</option></select><button class="cv-btn" type="submit">Añadir</button></form></div>
  </div>
 </div>
 <div class="cv-panel"><div class="cv-panel-head"><b>Condiciones del acuerdo</b><span class="cv-pill">${(c.history||[]).length} eventos registrados</span></div><div class="cv-panel-body"><div class="cv-hint">${cvEsc(c.notes||'No se han añadido condiciones adicionales.')}</div>${(c.history||[]).slice().reverse().slice(0,5).map(h=>`<div class="cv-history"><b>${cvEsc(h.date||'')}</b> · ${cvEsc(h.description||h.type||'Cambio registrado')}</div>`).join('')}</div></div>`;
 d.querySelectorAll('[data-sector]').forEach(el=>el.addEventListener('click',()=>{const sid=el.dataset.sector;const ix=selected.indexOf(sid);if(ix>=0)selected.splice(ix,1);else selected.push(sid);c.urbanAreas=selected;cvLog(c,(ix>=0?'Se retiró':'Se incorporó')+' '+(cvSectors.find(s=>s.id===sid)?.name||sid)+' de la delimitación urbana.');cvRenderDetail()}));
 const tf=d.querySelector('#cvThirdForm');if(tf)tf.addEventListener('submit',ev=>{ev.preventDefault();const fd=new FormData(tf);c.thirdPartyPresence=c.thirdPartyPresence||[];c.thirdPartyPresence.push({name:String(fd.get('name')).trim(),type:String(fd.get('type'))});cvLog(c,'Se añadió presencia de terceros: '+fd.get('name'));cvRenderDetail()});
 const inf=d.querySelector('#cvInstForm');if(inf)inf.addEventListener('submit',ev=>{ev.preventDefault();const fd=new FormData(inf);c.institutions=c.institutions||[];c.institutions.push({name:String(fd.get('name')).trim(),type:String(fd.get('type'))});cvLog(c,'Se añadió la institución '+fd.get('name'));cvRenderDetail()});
}
function cvRender(){if(!cvRoot)return;cvPopulateFilters();document.getElementById('cvDetail').style.display='none';document.getElementById('cvDirectory').style.display='block';document.getElementById('cvHeading').textContent='Concesiones';document.getElementById('cvSubtitle').textContent=`Regímenes especiales registrados para ${cvDate()||'la fecha actual de la partida'}. Cada concesión conserva sus propias competencias y condiciones.`;cvRenderDirectory()}
function cvOpen(id){cvSelectedId=id;cvRenderDetail()}
function cvOpenModal(id=null){
 const c=id?cvFind(id):null;cvEditing=!!c;cvNationOptions();document.getElementById('cvModalTitle').textContent=c?'Editar concesión':'Nueva concesión';document.getElementById('cvEditId').value=c?.id||'';
 const set=(id,v)=>document.getElementById(id).value=v??'';
 set('cvName',c?.name);set('cvCity',c?.city);set('cvHost',c?.host);set('cvAdmin',c?.concessionaire);set('cvType',c?.type||'urban');set('cvStatus',c?.status||'active');set('cvStart',c?.startDate||cvDate());set('cvEnd',c?.endDate);set('cvBudgetValue',c?.finance?.budget??0);set('cvPayment',c?.finance?.hostPaymentType||'none');set('cvPaymentValue',c?.finance?.hostPaymentValue);set('cvNotes',c?.notes);
 const comp=c?.competencies||{};[['cvCompAdmin','civilAdministration',true],['cvCompPolice','police',false],['cvCompOrder','publicOrder',false],['cvCompCourts','courts',false],['cvCompTax','taxation',false],['cvCompCustoms','customs',false],['cvCompInfra','infrastructure',true],['cvCompEducation','education',false],['cvCompMilitary','militaryPresence',false]].forEach(([id,key,def])=>document.getElementById(id).checked=comp[key]??def);
 document.getElementById('cvBudget').checked=c?.finance?.independentBudget??true;document.getElementById('cvModalBack').classList.add('show');
}
function cvCloseModal(){document.getElementById('cvModalBack').classList.remove('show')}
function cvSaveForm(){
 const f=document.getElementById('cvForm');if(!f.reportValidity())return;
 const id=document.getElementById('cvEditId').value;
 const host=document.getElementById('cvHost').value.trim(),admin=document.getElementById('cvAdmin').value.trim();
 const startRaw=document.getElementById('cvStart').value.trim(),endRaw=document.getElementById('cvEnd').value.trim(),datePattern=/^\d{4}(-\d{2}(-\d{2})?)?$/;
 if(startRaw&&!datePattern.test(startRaw)){alert('La fecha de inicio debe tener formato AAAA, AAAA-MM o AAAA-MM-DD.');return}
 if(endRaw&&!datePattern.test(endRaw)){alert('La fecha de finalización debe tener formato AAAA, AAAA-MM o AAAA-MM-DD.');return}
 if(startRaw&&endRaw&&cvNormDate(startRaw)>cvNormDate(endRaw)){alert('La fecha de finalización no puede ser anterior a la fecha de inicio.');return}
 const comp={civilAdministration:document.getElementById('cvCompAdmin').checked,police:document.getElementById('cvCompPolice').checked,publicOrder:document.getElementById('cvCompOrder').checked,courts:document.getElementById('cvCompCourts').checked,taxation:document.getElementById('cvCompTax').checked,customs:document.getElementById('cvCompCustoms').checked,infrastructure:document.getElementById('cvCompInfra').checked,education:document.getElementById('cvCompEducation').checked,militaryPresence:document.getElementById('cvCompMilitary').checked};
 let c=id?cvFind(id):null;
 if(!c){c={id:cvId(),urbanAreas:[],thirdPartyPresence:[],institutions:[],history:[]};cvState().concessions.push(c)}
 Object.assign(c,{name:document.getElementById('cvName').value.trim(),city:document.getElementById('cvCity').value.trim(),host,concessionaire:admin,type:document.getElementById('cvType').value,status:document.getElementById('cvStatus').value,startDate:document.getElementById('cvStart').value,endDate:document.getElementById('cvEnd').value||null,competencies:comp,finance:{independentBudget:document.getElementById('cvBudget').checked,budget:Number(document.getElementById('cvBudgetValue').value||0),hostPaymentType:document.getElementById('cvPayment').value,hostPaymentValue:document.getElementById('cvPaymentValue').value.trim()},notes:document.getElementById('cvNotes').value.trim()});
 cvLog(c,id?'Se actualizaron las condiciones del acuerdo.':'Se registró la creación de la concesión.',id?'modified':'created');
 cvSelectedId=c.id;cvCloseModal();cvRenderDetail();cvApi?.setStatus?.('Concesión actualizada · pulsa «Guardar partida» para exportar los cambios.');
}
function cvExport(){
 const payload={date:cvDate(),concessions:cvState().concessions};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='concesiones-'+(cvDate()||'partida')+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
cvRoot.addEventListener('click',ev=>{
 const b=ev.target.closest('[data-c-action]');if(!b)return;const act=b.dataset.cAction,id=b.dataset.id;
 if(act==='new')cvOpenModal();if(act==='edit')cvOpenModal(id);if(act==='close-modal')cvCloseModal();if(act==='submit-form')cvSaveForm();if(act==='export')cvExport();
 if(act==='open')cvOpen(id);if(act==='back'){cvSelectedId=null;cvRender()}
 if(act==='delete'){const c=cvFind(id);if(c&&c.status!=='ended'){if(confirm('¿Extinguir esta concesión en la fecha actual? Se conservará su historial.')){c.status='ended';c.endDate=cvDate();cvLog(c,'La concesión fue extinguida.','ended');cvRenderDetail();}}else if(c&&confirm('¿Eliminar definitivamente este registro? Esta acción no se puede deshacer.')){const ar=cvState().concessions,ix=ar.findIndex(x=>x.id===id);if(ix>=0)ar.splice(ix,1);cvSelectedId=null;cvRender();}}
 if(act==='remove-third'){const c=cvFind(cvSelectedId);if(c){c.thirdPartyPresence.splice(Number(b.dataset.index),1);cvLog(c,'Se retiró una presencia de terceros.');cvRenderDetail()}}
 if(act==='remove-inst'){const c=cvFind(cvSelectedId);if(c){c.institutions.splice(Number(b.dataset.index),1);cvLog(c,'Se retiró una institución.');cvRenderDetail()}}
});
document.getElementById('cvForm').addEventListener('submit',ev=>{ev.preventDefault();cvSaveForm()});
['cvSearch','cvFilterAdmin','cvFilterHost','cvFilterStatus'].forEach(id=>document.getElementById(id).addEventListener(id==='cvSearch'?'input':'change',cvRenderDirectory));
document.querySelectorAll('.map-mode').forEach(btn=>btn.addEventListener('click',()=>{
 const mode=btn.dataset.mapMode;
 const map=document.getElementById('gameMap'),wrap=document.querySelector('.game-mapwrap');
 if(mode==='concessions'){
  map.classList.add('concession-map-hidden');wrap.classList.add('concession-mode');cvRoot.classList.add('active');cvSelectedId=null;cvRender();document.getElementById('mapModeCaption').textContent='Gestión de concesiones';cvApi?.setStatus?.('Directorio de concesiones · '+cvListData().length+' registradas');
 }else{
  cvRoot.classList.remove('active');map.classList.remove('concession-map-hidden');wrap.classList.remove('concession-mode');
  if(mode==='political'){setTimeout(()=>window.dispatchEvent(new Event('resize')),100)}
 }
}));

window.__LTA_CONCESSIONS={
 resetView(){
  if(!cvRoot)return;
  cvRoot.classList.remove('active');
  document.getElementById('gameMap')?.classList.remove('concession-map-hidden');
  document.querySelector('.game-mapwrap')?.classList.remove('concession-mode');
 }
};
