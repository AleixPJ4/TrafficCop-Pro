
"use strict";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={view:'all',limit:50,favorites:new Set(JSON.parse(localStorage.getItem('tcp-favorites')||'[]'))};
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const euro=v=>{const s=String(v??'—'); if(!/^\d+(?:[.,]\d+)?$/.test(s.replace(/\./g,''))) return s; return Number(s.replace(/\./g,'').replace(',','.')).toLocaleString('es-ES')+' €'};
const nature=v=>({L:'Leve',G:'Grave',MG:'Muy grave','G/MG':'Grave / muy grave'}[v]||v||'—');
function toast(t){const e=$('#toast');if(!e)return;e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function openDialog(id){const d=$(id); if(d?.showModal) d.showModal();}
function closeDialog(id){const d=$(id); if(d?.open) d.close();}
function filtered(){const q=norm($('#searchInput')?.value),n=$('#normFilter')?.value||'',na=$('#natureFilter')?.value||'',p=$('#pointsFilter')?.value||'';let a=INFRACCIONS.filter(x=>{const hay=norm([x.concepte,x.article,x.norma,x.norma_completa,x.categoria,x.quantia,x.punts].join(' '));return(!q||hay.includes(q))&&(!n||x.norma===n)&&(!na||x.naturalesa===na)&&(!p||String(x.punts).replace('*','')===p)});if(state.view==='favorites')a=a.filter(x=>state.favorites.has(x.id));return a}
function render(){const a=filtered(),vis=a.slice(0,state.limit),box=$('#results');if(!box)return;$('#resultCount').textContent=`${a.length} resultados`;box.innerHTML='';if(!vis.length){box.innerHTML='<div class="empty">No se han encontrado coincidencias.</div>';$('#moreButton').hidden=true;return}vis.forEach(x=>{const f=$('#cardTemplate').content.cloneNode(true),set=(s,v)=>f.querySelector(s).textContent=v??'—';set('.norm',x.norma);set('.nature',x.naturalesa);set('.concept',x.concepte);set('.category',x.categoria);set('.article',x.article);set('.amount',euro(x.quantia));set('.discount',euro(x.descompte));set('.points',x.punts);set('.normFull',x.norma_completa);set('.natureFull',nature(x.naturalesa));set('.page',`Página ${x.pagina}`);set('.status',x.estat);set('.withdrawal',x.proposta_retirada||'—');const fav=f.querySelector('.favorite');fav.textContent=state.favorites.has(x.id)?'★':'☆';fav.onclick=()=>{state.favorites.has(x.id)?state.favorites.delete(x.id):state.favorites.add(x.id);localStorage.setItem('tcp-favorites',JSON.stringify([...state.favorites]));render()};f.querySelector('.copy').onclick=async()=>{await navigator.clipboard.writeText(x.concepte);toast('Concepto copiado')};f.querySelector('.share').onclick=async()=>{const t=`${x.concepte}\n${x.norma} · Art. ${x.article} · ${euro(x.quantia)} · ${x.punts} puntos`;if(navigator.share)await navigator.share({title:'TrafficCop Pro',text:t});else{await navigator.clipboard.writeText(t);toast('Ficha copiada')}};f.querySelector('.ticket-open').onclick=()=>openTicket(x);box.appendChild(f)});$('#moreButton').hidden=a.length<=state.limit}
function setQuery(q){$('#searchInput').value=q;state.limit=50;render();$('#catalogSection').scrollIntoView({behavior:'smooth'})}
function setupCatalog(){const norms=[...new Set(INFRACCIONS.map(x=>x.norma))].sort();$('#normFilter').innerHTML='<option value="">Todas las normas</option>'+norms.map(n=>`<option>${n}</option>`).join('');['searchInput','normFilter','natureFilter','pointsFilter'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{state.limit=50;render()}));$$('[data-query]').forEach(b=>b.onclick=()=>setQuery(b.dataset.query));$$('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;$$('[data-view]').forEach(x=>x.classList.toggle('active',x===b));render()});$('#clearButton').onclick=()=>{$('#searchInput').value='';$('#normFilter').value='';$('#natureFilter').value='';$('#pointsFilter').value='';render()};$('#moreButton').onclick=()=>{state.limit+=50;render()};$('#themeButton').onclick=()=>{document.documentElement.classList.toggle('dark');localStorage.setItem('tcp-theme',document.documentElement.classList.contains('dark')?'dark':'light')};if(localStorage.getItem('tcp-theme')==='dark')document.documentElement.classList.add('dark');render()}
function setupDrawer(){const d=$('#sideDrawer'),bg=$('#drawerBackdrop');const open=()=>{d.classList.add('open');bg.classList.add('open')},close=()=>{d.classList.remove('open');bg.classList.remove('open')};$('#menuButton').onclick=open;$('#drawerCloseButton').onclick=close;$('#drawerCloseButtonSecondary').onclick=close;bg.onclick=close;$('#submenuBackButton').onclick=()=>{$('#drawerMain').classList.add('active');$('#drawerSubmenu').classList.remove('active')};$$('.submenu-trigger').forEach(b=>b.onclick=()=>{const key=b.dataset.submenu;$('#submenuTitle').textContent=b.querySelector('strong')?.textContent||'Menú';$('#submenuContent').innerHTML=`<button class="submenu-item" data-close-menu><span class="menu-icon">⌕</span><span class="menu-copy"><strong>Abrir buscador</strong><small>Consulta rápida</small></span></button>`;$('#drawerMain').classList.remove('active');$('#drawerSubmenu').classList.add('active');$('#submenuContent button').onclick=()=>{close();$('#catalogSection').scrollIntoView({behavior:'smooth'})}});$$('#drawerMain [data-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==='home')window.scrollTo({top:0,behavior:'smooth'});if(a==='search')$('#catalogSection').scrollIntoView({behavior:'smooth'});if(a==='assistant')openDialog('#assistantDialog');if(a==='favorites'){state.view='favorites';render();$('#catalogSection').scrollIntoView({behavior:'smooth'})}close()});$('#legalCloseButton').onclick=()=>closeDialog('#legalDialog')}
function setupAI(){const open=()=>openDialog('#assistantDialog');$('#assistantOpenButton').onclick=open;$('#assistantCloseButton').onclick=()=>closeDialog('#assistantDialog');$('#assistantAnalyzeButton').onclick=()=>{const q=$('#assistantText').value.trim();if(!q)return;const words=norm(q).split(/\s+/).filter(w=>w.length>2);const top=INFRACCIONS.map(x=>({x,s:words.reduce((n,w)=>n+(norm(x.concepte).includes(w)?1:0),0)})).filter(o=>o.s).sort((a,b)=>b.s-a.s).slice(0,6);$('#assistantStatus').textContent=top.length?`${top.length} posibles coincidencias`:'Sin coincidencias claras';$('#assistantResults').innerHTML=top.map(o=>`<article class="ai-result"><h4>${o.x.concepte}</h4><p>${o.x.norma} · Art. ${o.x.article}</p><button data-ai-id="${o.x.id}">Abrir infracción</button></article>`).join('');$$('[data-ai-id]').forEach(b=>b.onclick=()=>{const x=INFRACCIONS.find(i=>i.id===b.dataset.aiId);closeDialog('#assistantDialog');setQuery(x.concepte)})};$('#voiceSearchButton').onclick=()=>toast('Usa el micrófono del teclado para dictar');$('#assistantMicButton').onclick=()=>toast('Usa el micrófono del teclado para dictar')}



let currentTicketItem=null;

function clearTicketChecks(){
  ["sctRGC","sctRGV","sctTRLSV","sctRGCond","sctAOV","sctOther"].forEach(id=>{
    document.getElementById(id)?.classList.remove("checked");
  });
  $("#sctOtherLabel").textContent="Altres";
}

function openTicket(item){
  currentTicketItem=item;
  clearTicketChecks();

  const map={
    RGC:"sctRGC",
    RGV:"sctRGV",
    TRLSV:"sctTRLSV",
    RGCond:"sctRGCond",
    AOV:"sctAOV",
    SOA:"sctOther",
    REPC:"sctOther"
  };

  const checkId=map[item.norma]||"sctOther";
  document.getElementById(checkId)?.classList.add("checked");
  if(checkId==="sctOther") $("#sctOtherLabel").textContent=item.norma||"Altres";

  $("#sctPoints").textContent=String(item.punts??"—");
  $("#sctArticle").textContent=item.article||"—";
  $("#sctAmount").textContent=euro(item.quantia);
  $("#sctDiscount").textContent=euro(item.descompte);
  $("#sctFact").textContent=item.concepte||"—";
  $("#sctFact").classList.toggle("compact",(item.concepte||"").length>120);
  $("#sctFact").classList.toggle("very-compact",(item.concepte||"").length>190);

  openDialog("#ticketDialog");
}

function setupTicket(){
  $("#ticketCloseButton").onclick=()=>closeDialog("#ticketDialog");
  $("#ticketBackButton").onclick=()=>closeDialog("#ticketDialog");
  $("#ticketPrintButton").onclick=()=>window.print();
  $("#ticketFullscreenButton").onclick=()=>{
    const page=document.querySelector(".ticket-page-pro");
    page.classList.toggle("fullscreen");
    $("#ticketFullscreenButton").textContent=page.classList.contains("fullscreen")
      ?"↙ Sortir de pantalla completa"
      :"↗ Pantalla completa";
  };
}
const docs={manifestacion:{title:'Acta de manifestación',fields:[['fecha','Fecha','date'],['hora','Hora','time'],['lugar','Lugar','text'],['manifestante','Nombre de la persona manifestante','text'],['documento','Documento identificativo','text'],['agentes','Agentes actuantes / TIP','text'],['hechos','Manifestación de los hechos','textarea'],['observaciones','Observaciones adicionales','textarea']],build:v=>`ACTA DE MANIFESTACIÓN\n\nEn ${v.lugar||'__________'}, en fecha ${v.fecha||'__________'}, a las ${v.hora||'____'} horas, ante los agentes actuantes ${v.agentes||'__________'}, comparece ${v.manifestante||'__________'}, con documento identificativo ${v.documento||'__________'}, quien manifiesta:\n\n${v.hechos||'__________'}\n\nObservaciones:\n${v.observaciones||'Sin observaciones adicionales.'}\n\nY para que conste, se extiende la presente acta.`},ampliatorio:{title:'Informe ampliatorio',fields:[['referencia','Referencia','text'],['asunto','Asunto','text'],['antecedentes','Antecedentes','textarea'],['actuaciones','Actuaciones','textarea'],['resultado','Resultado','textarea']],build:v=>`INFORME AMPLIATORIO\n\nReferencia: ${v.referencia||'____'}\nAsunto: ${v.asunto||'____'}\n\nANTECEDENTES\n${v.antecedentes||'____'}\n\nACTUACIONES\n${v.actuaciones||'____'}\n\nRESULTADO\n${v.resultado||'____'}`},diligencia:{title:'Diligencia básica',fields:[['lugar','Lugar','text'],['agentes','Agentes / TIP','text'],['hechos','Hechos','textarea'],['gestiones','Gestiones','textarea'],['resultado','Resultado','textarea']],build:v=>`DILIGENCIA DE ACTUACIÓN\n\nLugar: ${v.lugar||'____'}\nAgentes: ${v.agentes||'____'}\n\nHECHOS\n${v.hechos||'____'}\n\nGESTIONES\n${v.gestiones||'____'}\n\nRESULTADO\n${v.resultado||'____'}`}};let currentDoc='manifestacion';function openDoc(t){currentDoc=t;const c=docs[t];$('#documentTitle').textContent=c.title;$('#documentForm').innerHTML=c.fields.map(([n,l,t])=>`<label class="${t==='textarea'?'full':''}">${l}${t==='textarea'?`<textarea name="${n}" rows="4"></textarea>`:`<input name="${n}" type="${t}">`}</label>`).join('');$('#documentOutput').value='';openDialog('#documentDialog')}
function values(){const v={};$$('#documentForm [name]').forEach(e=>v[e.name]=e.value.trim());return v}
function setupDocuments(){$$('[data-document]').forEach(b=>b.onclick=()=>openDoc(b.dataset.document));$('#documentCloseButton').onclick=()=>closeDialog('#documentDialog');$('#generateDocumentButton').onclick=()=>$('#documentOutput').value=docs[currentDoc].build(values());$('#copyDocumentButton').onclick=async()=>{if(!$('#documentOutput').value)$('#generateDocumentButton').click();await navigator.clipboard.writeText($('#documentOutput').value);toast('Documento copiado')};$('#improveDocumentButton').onclick=()=>{$$('#documentForm textarea').forEach(t=>{let s=t.value.trim().replace(/\biva\b/gi,'iba').replace(/\besta\b/gi,'está').replace(/\bcaido\b/gi,'caído');if(s&&!/[.!?]$/.test(s))s+='.';t.value=s.charAt(0).toUpperCase()+s.slice(1)});$('#generateDocumentButton').click();$('#documentAiStatus').textContent='Texto corregido. Revísalo antes de utilizarlo.'}}
function suiteHTML(k){if(k==='traffic')return '<div class="module-grid"><section class="module-box"><h3>Catálogo SCT</h3><p>Accede al buscador completo.</p><button data-act="search">Abrir buscador</button></section><section class="module-box"><h3>Favoritas</h3><p>Consulta tus fichas guardadas.</p><button data-act="favorites">Abrir favoritas</button></section></div>';if(k==='documents')return '<div class="module-grid"><section class="module-box"><h3>Acta de manifestación</h3><button data-doc="manifestacion">Abrir</button></section><section class="module-box"><h3>Informe ampliatorio</h3><button data-doc="ampliatorio">Abrir</button></section><section class="module-box"><h3>Diligencia básica</h3><button data-doc="diligencia">Abrir</button></section></div>';if(k==='photo')return '<div class="photo-builder"><input id="photoFiles" type="file" accept="image/*" multiple><div id="photoList" class="photo-list"></div><button id="generatePhotoText" class="primary-action">Generar informe</button><textarea id="photoOutput" rows="10"></textarea></div>';if(k==='accident')return '<div class="module-box"><h3>Cronología</h3><p>Registra horas y actuaciones.</p><button id="addTime">Añadir actuación</button><div id="timeList"></div></div>';if(k==='legal')return '<div class="module-grid"><section class="module-box"><h3>Fuente</h3><p>Catálogo SCT de 20 de mayo de 2026.</p></section><section class="module-box"><h3>Uso profesional</h3><p>Verifica siempre el encaje exacto del hecho.</p></section></div>';return '<div class="module-box"><h3>GPS</h3><p>Obtén coordenadas del dispositivo.</p><button id="gpsBtn">Obtener ubicación</button><div id="gpsOut"></div></div>'}
function openSuite(k){$('#suiteTitle').textContent=({traffic:'Catálogo SCT',documents:'Documentos',photo:'Informe fotográfico',accident:'Accidentes',legal:'Biblioteca legal',tools:'Herramientas'}[k]||'Módulo');$('#suiteContent').innerHTML=suiteHTML(k);openDialog('#suiteDialog');$$('[data-act]').forEach(b=>b.onclick=()=>{if(b.dataset.act==='search'){closeDialog('#suiteDialog');$('#catalogSection').scrollIntoView({behavior:'smooth'})}else{state.view='favorites';render();closeDialog('#suiteDialog');$('#catalogSection').scrollIntoView({behavior:'smooth'})}});$$('[data-doc]').forEach(b=>b.onclick=()=>{closeDialog('#suiteDialog');openDoc(b.dataset.doc)});if(k==='photo'){const inp=$('#photoFiles');inp.onchange=()=>{$('#photoList').innerHTML=[...inp.files].map((f,i)=>`<div class="photo-row"><img src="${URL.createObjectURL(f)}"><textarea data-p="${i}">Vista correspondiente a la fotografía núm. ${i+1}.</textarea></div>`).join('')};$('#generatePhotoText').onclick=()=>$('#photoOutput').value=$$('#photoList textarea').map((t,i)=>`FOTOGRAFÍA NÚM. ${i+1}\n${t.value}`).join('\n\n')}if(k==='accident')$('#addTime').onclick=()=>$('#timeList').insertAdjacentHTML('beforeend','<div class="timeline-row"><input type="time"><input placeholder="Actuación"></div>');if(k==='tools')$('#gpsBtn').onclick=()=>navigator.geolocation?.getCurrentPosition(p=>$('#gpsOut').textContent=`${p.coords.latitude.toFixed(6)}, ${p.coords.longitude.toFixed(6)}`,()=>$('#gpsOut').textContent='No disponible')}
function setupSuite(){$$('[data-suite]').forEach(b=>b.onclick=()=>openSuite(b.dataset.suite));$('#suiteCloseButton').onclick=()=>closeDialog('#suiteDialog')}
function setupNav(){$$('[data-pro-nav]').forEach(b=>b.onclick=()=>{const a=b.dataset.proNav;if(a==='home')scrollTo({top:0,behavior:'smooth'});if(a==='search')$('#catalogSection').scrollIntoView({behavior:'smooth'});if(a==='documents')openSuite('documents');if(a==='more')$('#menuButton').click()});$('#serviceModeButton').onclick=()=>{$('#serviceModeButton').classList.toggle('active');$('#serviceStatus').textContent=$('#serviceModeButton').classList.contains('active')?'Modo servicio activo':'Modo consulta'};$('#customizeQuickButton').onclick=()=>toast('Personalización próximamente');$('#clearRecentButton').onclick=()=>{localStorage.removeItem('tcp-recents');$('#recentSearches').innerHTML='<span class="recent-empty">Aún no hay consultas guardadas.</span>'};$('#finishOnboardingButton').onclick=()=>{localStorage.setItem('tcp-onboarded','1');closeDialog('#onboardingDialog')};if(!localStorage.getItem('tcp-onboarded'))setTimeout(()=>openDialog('#onboardingDialog'),300)}


function setupDrawerBehaviourFix(){
  const drawer=document.getElementById("sideDrawer");
  if(!drawer) return;

  const observer=new MutationObserver(()=>{
    document.body.classList.toggle("drawer-open",drawer.classList.contains("open"));
  });
  observer.observe(drawer,{attributes:true,attributeFilter:["class"]});

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape" && drawer.classList.contains("open")){
      document.getElementById("menuButton")?.click();
    }
  });
}


const ATESTADOS={comparecencia:['Comparecencia de agentes','Lugar','Agentes actuantes / TIP','Relación cronológica de los hechos'],derechos:['Información de derechos','Persona informada','Documento identificativo','Observaciones'],identificacion:['Identificación de conductor y vehículo','Lugar','Conductor/a','Vehículo y matrícula'],inmovilizacion:['Diligencia de inmovilización','Lugar','Vehículo y matrícula','Motivo y medidas adoptadas'],sintomas:['Síntomas externos','Persona examinada','Habla y equilibrio','Otros signos objetivos'],pruebas:['Pruebas de alcohol o drogas','Persona sometida','Resultados y horas','Instrumento utilizado'],negativa:['Negativa a las pruebas','Persona requerida','Requerimientos realizados','Advertencias y respuesta'],inspeccion:['Inspección ocular','Lugar','Características de la vía','Vestigios y medidas'],manifestacion:['Manifestación','Persona compareciente','Documento','Manifestación'],remision:['Remisión al juzgado','Juzgado destinatario','Número de atestado','Documentos remitidos'],finalizacion:['Finalización del atestado','Número de atestado','Número de folios','Anexos y destino']};let currentAtestado='';function openAtestados(){openDialog('#atestadosDialog');$('#atestadosGrid').hidden=false;$('#atestadoBuilder').hidden=true}function openAtestado(type){currentAtestado=type;const c=ATESTADOS[type];if(!c)return;$('#atestadosGrid').hidden=true;$('#atestadoBuilder').hidden=false;$('#atestadoTitle').textContent=c[0];const f=$('#atestadoForm');f.innerHTML='';[['fecha','Fecha','date'],['hora','Hora','time'],['campo1',c[1],'text'],['campo2',c[2],'text'],['contenido',c[3],'textarea']].forEach(([n,l,t])=>{const w=document.createElement('label');if(t==='textarea')w.className='full';w.textContent=l;const e=t==='textarea'?document.createElement('textarea'):document.createElement('input');if(t!=='textarea')e.type=t;e.name=n;w.appendChild(e);f.appendChild(w)});$('#atestadoOutput').value=''}function buildAtestado(){const c=ATESTADOS[currentAtestado];const v={};document.querySelectorAll('#atestadoForm [name]').forEach(e=>v[e.name]=e.value.trim());return `${c[0].toUpperCase()}\n\nFecha: ${v.fecha||'__________'}\nHora: ${v.hora||'____'}\n${c[1]}: ${v.campo1||'__________'}\n${c[2]}: ${v.campo2||'__________'}\n\n${c[3].toUpperCase()}\n\n${v.contenido||'________________________________________________________________'}\n\nY para que conste, se extiende la presente diligencia.`}function setupAtestados(){document.querySelectorAll('[data-atestados-open]').forEach(b=>b.onclick=openAtestados);$('#atestadosCloseButton').onclick=()=>closeDialog('#atestadosDialog');$('#atestadoBackButton').onclick=()=>{$('#atestadosGrid').hidden=false;$('#atestadoBuilder').hidden=true};document.querySelectorAll('[data-atestado]').forEach(b=>b.onclick=()=>openAtestado(b.dataset.atestado));$('#atestadosSearchInput').oninput=e=>{const q=normalize(e.target.value);document.querySelectorAll('[data-atestado]').forEach(b=>b.hidden=q&&!normalize(b.textContent).includes(q))};$('#atestadoGenerateButton').onclick=()=>$('#atestadoOutput').value=buildAtestado();$('#atestadoCopyButton').onclick=async()=>{if(!$('#atestadoOutput').value)$('#atestadoOutput').value=buildAtestado();await navigator.clipboard.writeText($('#atestadoOutput').value);toast('Diligencia copiada')}}


const AW_TEMPLATES=[
 {id:"inicio-oficio",title:"Inicio por actuación policial de oficio",category:"seguridad-vial",detail:"Diligencia utilizada cuando los agentes inician actuaciones por iniciativa propia sin denuncia previa.",body:`<h3>DILIGENCIA DE INICIO DE ACTUACIONES</h3><p>En <span class="var">{{LOCALIDAD}}</span>, siendo las <span class="var">{{HORA}}</span> horas del día <span class="var">{{FECHA}}</span>, los agentes con números profesionales <span class="var">{{AGENTES_ACTUANTES}}</span>, encontrándose de servicio de <span class="var">{{SERVICIO}}</span>, fueron requeridos para dirigirse a <span class="var">{{LUGAR_HECHOS}}</span> con motivo de <span class="var">{{MOTIVO_REQUERIMIENTO}}</span>.</p><p>Personados en el lugar, se tuvo conocimiento de los hechos que a continuación se relacionan, iniciándose las presentes diligencias para su esclarecimiento y posterior remisión al Juzgado de Instrucción competente.</p><p>Lo que se hace constar a los efectos oportunos.</p><p>En <span class="var">{{LOCALIDAD}}</span>, a <span class="var">{{FECHA}}</span>.</p><br><table style="width:100%"><tr><td><b>EL INSTRUCTOR</b><br><span class="var">{{NOMBRE_INSTRUCTOR}}</span><br>Nº Profesional <span class="var">{{TIP_INSTRUCTOR}}</span></td><td><b>EL SECRETARIO</b><br><span class="var">{{NOMBRE_SECRETARIO}}</span><br>Nº Profesional <span class="var">{{TIP_SECRETARIO}}</span></td></tr></table>`},
 {id:"inicio-denuncia",title:"Inicio por denuncia presencial",category:"procesal",detail:"Inicio de actuaciones a partir de la comparecencia de una persona denunciante.",body:`<h3>DILIGENCIA DE INICIO POR DENUNCIA PRESENCIAL</h3><p>En <span class="var">{{LOCALIDAD}}</span>, a las <span class="var">{{HORA}}</span> horas del día <span class="var">{{FECHA}}</span>, comparece en dependencias policiales <span class="var">{{PERSONA_DENUNCIANTE}}</span>, quien manifiesta hechos que pudieran revestir carácter penal.</p><p>En atención a lo expuesto, se inician las presentes diligencias, procediéndose a la identificación de las personas intervinientes, recogida de manifestaciones y práctica de las actuaciones necesarias.</p>`},
 {id:"inicio-112",title:"Inicio por llamada al 112",category:"procesal",detail:"Inicio derivado de comunicación de sala o servicio de emergencias.",body:`<h3>DILIGENCIA DE INICIO POR REQUERIMIENTO</h3><p>A las <span class="var">{{HORA}}</span> horas se recibe comunicación de <span class="var">{{SALA_COORDINACION}}</span> para acudir a <span class="var">{{LUGAR_HECHOS}}</span> por <span class="var">{{MOTIVO}}</span>.</p><p>Una vez en el lugar se practican las primeras actuaciones de protección, identificación y comprobación de los hechos.</p>`},
 {id:"inicio-accidente",title:"Inicio por accidente de tráfico",category:"accidentes",detail:"Inicio de diligencias por siniestro vial con relevancia penal o investigadora.",body:`<h3>DILIGENCIA DE INICIO POR ACCIDENTE DE TRÁFICO</h3><p>Los agentes son comisionados a <span class="var">{{LUGAR}}</span> por un accidente de tráfico en el que se encuentran implicados <span class="var">{{VEHICULOS}}</span>.</p><p>Se asegura la zona, se atiende a las personas implicadas y se inicia la inspección ocular, identificación y comprobaciones reglamentarias.</p>`},
 {id:"inicio-alcohol",title:"Inicio por alcoholemia positiva",category:"seguridad-vial",detail:"Inicio de atestado por resultado penalmente relevante o signos de influencia.",body:`<h3>DILIGENCIA DE INICIO POR ALCOHOLEMIA</h3><p>Durante la actuación realizada en <span class="var">{{LUGAR}}</span>, el conductor <span class="var">{{CONDUCTOR}}</span> es sometido a pruebas de detección alcohólica, obteniéndose los resultados que constan en diligencia separada.</p><p>Atendiendo al resultado y/o a los signos externos observados, se inician diligencias por un posible delito contra la seguridad vial.</p>`},
 {id:"inicio-sin-permiso",title:"Inicio por conducción sin permiso",category:"seguridad-vial",detail:"Procedimiento por conducción sin haber obtenido permiso o por pérdida de vigencia judicial/administrativa.",body:`<h3>DILIGENCIA DE INICIO POR CONDUCCIÓN SIN PERMISO</h3><p>Comprobada la identidad del conductor <span class="var">{{CONDUCTOR}}</span> y consultadas las bases disponibles, se constata <span class="var">{{SITUACION_PERMISO}}</span>.</p><p>Se inician diligencias por posible delito contra la seguridad vial, documentándose en diligencias separadas las consultas, citación e inmovilización adoptada.</p>`},
 {id:"comparecencia",title:"Comparecencia de agentes",category:"procesal",detail:"Relato cronológico de la intervención por los agentes actuantes.",body:`<h3>DILIGENCIA DE COMPARECENCIA</h3><p>Comparecen los agentes <span class="var">{{AGENTES}}</span> y manifiestan que, encontrándose de servicio, intervinieron en los hechos siguientes:</p><p><span class="var">{{RELATO_CRONOLOGICO}}</span></p><p>Se hace constar que el relato se efectúa de forma cronológica, objetiva y diferenciando lo observado directamente de lo manifestado por terceras personas.</p>`},
 {id:"identificacion",title:"Identificación del investigado",category:"procesal",detail:"Identificación, domicilio, documentación y comprobaciones de la persona investigada.",body:`<h3>DILIGENCIA DE IDENTIFICACIÓN</h3><p>Se identifica a <span class="var">{{NOMBRE}}</span>, con documento <span class="var">{{DOCUMENTO}}</span>, domicilio en <span class="var">{{DOMICILIO}}</span>, y demás datos que constan en el atestado.</p>`},
 {id:"derechos",title:"Información de derechos",category:"procesal",detail:"Información de derechos en lenguaje comprensible y adaptado a la persona destinataria.",body:`<h3>DILIGENCIA DE INFORMACIÓN DE DERECHOS</h3><p>Se informa a <span class="var">{{PERSONA_INVESTIGADA}}</span>, de forma comprensible y accesible, de los hechos que se le atribuyen y de los derechos que legalmente le corresponden, haciendo entrega del documento correspondiente.</p><p>La persona manifiesta haber comprendido la información facilitada y recibe copia.</p>`},
 {id:"sintomas",title:"Diligencia de síntomas",category:"seguridad-vial",detail:"Descripción objetiva de habla, equilibrio, ojos, conducta y otros signos externos.",body:`<h3>DILIGENCIA DE SÍNTOMAS EXTERNOS</h3><p>Respecto de <span class="var">{{PERSONA}}</span> se observan los signos siguientes:</p><p><b>Habla:</b> <span class="var">{{HABLA}}</span><br><b>Equilibrio y deambulación:</b> <span class="var">{{EQUILIBRIO}}</span><br><b>Ojos y pupilas:</b> <span class="var">{{OJOS}}</span><br><b>Conducta:</b> <span class="var">{{CONDUCTA}}</span></p>`},
 {id:"alcoholemia",title:"Prueba de alcoholemia",category:"seguridad-vial",detail:"Horas, resultados, intervalo e instrumento utilizado.",body:`<h3>DILIGENCIA DE PRUEBAS DE ALCOHOLEMIA</h3><p>Se practica una primera prueba a las <span class="var">{{HORA_1}}</span>, con resultado de <span class="var">{{RESULTADO_1}}</span> mg/l, y una segunda prueba a las <span class="var">{{HORA_2}}</span>, con resultado de <span class="var">{{RESULTADO_2}}</span> mg/l.</p><p>Instrumento: <span class="var">{{INSTRUMENTO}}</span>. Se informa de los derechos y posibilidades de contraste previstos legalmente.</p>`},
 {id:"drogas",title:"Prueba de drogas",category:"seguridad-vial",detail:"Prueba indiciaria, muestra salival, custodia y medicación manifestada.",body:`<h3>DILIGENCIA DE PRUEBA DE DROGAS</h3><p>Se realiza prueba indiciaria a <span class="var">{{PERSONA}}</span>, obteniéndose resultado <span class="var">{{RESULTADO}}</span>. Se procede a la obtención y precintado de la muestra para análisis, documentándose la cadena de custodia.</p>`},
 {id:"efectos",title:"Intervención de efectos",category:"procesal",detail:"Descripción, embalaje, precinto y cadena de custodia de efectos intervenidos.",body:`<h3>DILIGENCIA DE INTERVENCIÓN DE EFECTOS</h3><p>Se intervienen los siguientes efectos: <span class="var">{{EFECTOS}}</span>, localizados en <span class="var">{{LUGAR_LOCALIZACION}}</span> y relacionados con <span class="var">{{PERSONA}}</span>.</p><p>Los efectos son descritos, embalados, identificados y sometidos a cadena de custodia.</p>`},
 {id:"citacion",title:"Citación para juicio rápido",category:"procesal",detail:"Citación de investigado, testigos y perjudicados cuando proceda.",body:`<h3>DILIGENCIA DE CITACIÓN</h3><p>Se cita a <span class="var">{{PERSONA}}</span> para comparecer ante <span class="var">{{ORGANO_JUDICIAL}}</span> el día <span class="var">{{FECHA_CITACION}}</span> a las <span class="var">{{HORA_CITACION}}</span>.</p>`},
 {id:"vehiculo",title:"Situación del vehículo",category:"seguridad-vial",detail:"Inmovilización, depósito, entrega a persona habilitada o retirada.",body:`<h3>DILIGENCIA SOBRE LA SITUACIÓN DEL VEHÍCULO</h3><p>Respecto del vehículo <span class="var">{{VEHICULO}}</span>, se adopta la medida de <span class="var">{{MEDIDA}}</span>, por el motivo <span class="var">{{MOTIVO}}</span>.</p>`},
 {id:"union",title:"Unión de documentos",category:"procesal",detail:"Incorporación ordenada de actas, consultas, fotografías y anexos.",body:`<h3>DILIGENCIA DE UNIÓN DE DOCUMENTOS</h3><p>Se unen al atestado los documentos y anexos siguientes:</p><p><span class="var">{{RELACION_DOCUMENTOS}}</span></p>`},
 {id:"remision",title:"Diligencia de remisión",category:"procesal",detail:"Cierre, índice y remisión al órgano judicial competente.",body:`<h3>DILIGENCIA DE REMISIÓN</h3><p>Finalizadas las actuaciones, se remite el presente atestado, junto con sus documentos y efectos, al <span class="var">{{ORGANO_DESTINO}}</span>, quedando constancia de su composición e índice.</p>`},
 {id:"salud-publica",title:"Intervención por salud pública",category:"salud-publica",detail:"Minuta detallada, sustancia, indicios de tráfico, pesaje y cadena de custodia.",body:`<h3>DILIGENCIA DE INTERVENCIÓN POR DELITO CONTRA LA SALUD PÚBLICA</h3><p>Se hace constar la intervención de <span class="var">{{SUSTANCIAS}}</span>, localizada en <span class="var">{{LUGAR}}</span>, junto con los siguientes indicios: <span class="var">{{INDICIOS}}</span>.</p><p>Se documenta el pesaje, embalaje, persona a quien se interviene y cadena de custodia, sin atribuir a los agentes la determinación del peso neto analítico.</p>`},
 {id:"violencia",title:"Primera actuación en violencia de género/doméstica",category:"violencia",detail:"Identificación de relación, protección inicial, manifestaciones y medidas adoptadas.",body:`<h3>DILIGENCIA DE PRIMERA ACTUACIÓN EN VIOLENCIA DE GÉNERO O DOMÉSTICA</h3><p>Se identifican las personas implicadas y la relación existente entre ellas, se adoptan medidas inmediatas de protección y separación, y se documentan de forma diferenciada las manifestaciones, lesiones observadas, antecedentes referidos y actuaciones realizadas.</p>`}
,
 {id:"recepcion",title:"Diligencia de recepción",category:"procesal",detail:"Recepción formal de documentos, objetos o actuaciones incorporadas al atestado.",body:`<h3>DILIGENCIA DE RECEPCIÓN</h3><p>Se recibe de <span class="var">{{PERSONA_O_UNIDAD}}</span> la documentación, objeto o actuación siguiente: <span class="var">{{ELEMENTO_RECIBIDO}}</span>.</p><p>Se incorpora al presente atestado mediante la referencia <span class="var">{{REFERENCIA}}</span>, dejando constancia de la fecha, hora y persona que efectúa la entrega.</p>`},
 {id:"antecedentes",title:"Diligencia de antecedentes",category:"procesal",detail:"Resultado de las consultas de antecedentes y requisitorias practicadas.",body:`<h3>DILIGENCIA DE ANTECEDENTES</h3><p>Consultadas las bases policiales disponibles respecto de <span class="var">{{PERSONA}}</span>, se obtiene el resultado siguiente:</p><p><span class="var">{{RESULTADO_CONSULTA}}</span></p><p>Las consultas se realizan a los solos efectos de la instrucción del presente atestado.</p>`},
 {id:"informe",title:"Diligencia de informe policial",category:"procesal",detail:"Resumen o aclaración de actuaciones complejas realizado por la instrucción.",body:`<h3>DILIGENCIA DE INFORME POLICIAL</h3><p>La instrucción hace constar, a efectos de ordenar y esclarecer las actuaciones practicadas, lo siguiente:</p><p><span class="var">{{INFORME_SINTETICO}}</span></p>`},
 {id:"participacion",title:"Diligencia de participación de agentes",category:"procesal",detail:"Relación de agentes y funciones cuando intervienen numerosas dotaciones.",body:`<h3>DILIGENCIA DE PARTICIPACIÓN</h3><p>En las presentes actuaciones han participado los agentes y unidades siguientes:</p><p><span class="var">{{RELACION_AGENTES_Y_FUNCIONES}}</span></p>`},
 {id:"generica",title:"Diligencia genérica",category:"procesal",detail:"Constancia de un hecho puntual relevante no cubierto por otra plantilla.",body:`<h3>DILIGENCIA PARA HACER CONSTAR</h3><p>Se hace constar que:</p><p><span class="var">{{HECHO_RELEVANTE}}</span></p>`},
 {id:"habeas",title:"Solicitud de habeas corpus",category:"procesal",detail:"Constancia y tramitación de una solicitud de habeas corpus.",body:`<h3>DILIGENCIA DE SOLICITUD DE HABEAS CORPUS</h3><p>A las <span class="var">{{HORA}}</span> horas, la persona detenida <span class="var">{{PERSONA_DETENIDA}}</span> solicita la incoación del procedimiento de habeas corpus.</p><p>La solicitud se comunica inmediatamente a <span class="var">{{AUTORIDAD_JUDICIAL}}</span>, efectuándose las gestiones siguientes: <span class="var">{{GESTIONES}}</span>.</p>`},
 {id:"sin-efecto",title:"Dejar sin efecto una detención",category:"procesal",detail:"Constancia de la puesta en libertad y causas por las que se deja sin efecto la detención.",body:`<h3>DILIGENCIA PARA DEJAR SIN EFECTO LA DETENCIÓN</h3><p>A las <span class="var">{{HORA}}</span> horas del día <span class="var">{{FECHA}}</span>, se deja sin efecto la detención de <span class="var">{{PERSONA}}</span> por el motivo siguiente:</p><p><span class="var">{{MOTIVO}}</span></p><p>La persona queda informada de su situación y de las obligaciones que, en su caso, le correspondan.</p>`},
 {id:"otrosi",title:"Otrosí",category:"procesal",detail:"Corrección de error material o incorporación de circunstancia relevante antes de la remisión.",body:`<h3>OTROSÍ</h3><p>Se hace constar que se ha advertido el siguiente error material, omisión o circunstancia significativa:</p><p><span class="var">{{CORRECCION_O_CIRCUNSTANCIA}}</span></p><p>La presente diligencia se incorpora antes de la remisión del atestado.</p>`}
];

const AW_INITIAL_DILIGENCES=["inicio-oficio","comparecencia","identificacion","derechos","sintomas","alcoholemia","drogas","efectos","citacion","vehiculo","union","remision"];
let awDiligences=[];
let awCurrentIndex=0;
let awSelectedTemplate=AW_TEMPLATES[0];

function awTemplate(id){return AW_TEMPLATES.find(t=>t.id===id)}
function awOpen(){
  document.querySelector("#homeView").hidden=true;
  document.querySelector(".bottomnav")?.setAttribute("hidden","");
  document.querySelector(".topbar")?.setAttribute("hidden","");
  document.querySelector(".desktop-police-rail")?.setAttribute("hidden","");
  const workspace=$("#atestadosWorkspace");
  workspace.hidden=false;
  document.body.style.overflow="hidden";
  awLoad();
}
function awClose(){
  $("#atestadosWorkspace").hidden=true;
  $("#homeView").hidden=false;
  document.querySelector(".bottomnav")?.removeAttribute("hidden");
  document.querySelector(".topbar")?.removeAttribute("hidden");
  document.querySelector(".desktop-police-rail")?.removeAttribute("hidden");
  document.body.style.overflow="";
}
function awLoad(){
  try{
    const saved=JSON.parse(localStorage.getItem("tcp-aw-case")||"null");
    awDiligences=saved?.diligences||AW_INITIAL_DILIGENCES.map((id,i)=>({id,content:awTemplate(id).body,date:`02/08/2026 ${String(3+Math.floor(i/3)).padStart(2,"0")}:${String((i*5)%60).padStart(2,"0")}`}));
  }catch{awDiligences=AW_INITIAL_DILIGENCES.map(id=>({id,content:awTemplate(id).body,date:"02/08/2026 03:15"}))}
  awCurrentIndex=Math.min(awCurrentIndex,awDiligences.length-1);
  awRenderDiligences();awRenderLibrary();awRenderRecommendations();awSelectDiligence(awCurrentIndex);
}
function awSave(){
  localStorage.setItem("tcp-aw-case",JSON.stringify({diligences:awDiligences,savedAt:new Date().toISOString()}));
  toast("Atestado guardado en este dispositivo");
}
function awRenderDiligences(){
  const box=$("#awDiligenceItems");box.innerHTML="";
  awDiligences.forEach((d,i)=>{
    const t=awTemplate(d.id);
    const b=document.createElement("button");b.className="aw-diligence-item"+(i===awCurrentIndex?" active":"");
    b.innerHTML=`<span class="number">${String(i+1).padStart(2,"0")}</span><span><strong>${d.customTitle||t?.title||"Diligencia"}</strong><small>${d.date||""}</small></span><span class="state">${i%4===0?"★":"●"}</span>`;
    b.onclick=()=>awSelectDiligence(i);box.appendChild(b)
  });
  $("#awDiligenceCount").textContent=`(${awDiligences.length})`;
}
function awSelectDiligence(index){
  if(awDiligences[awCurrentIndex] && $("#awEditableDocument"))awDiligences[awCurrentIndex].content=$("#awEditableDocument").innerHTML;
  awCurrentIndex=index;
  const d=awDiligences[index],t=awTemplate(d.id);
  $("#awCurrentNumber").textContent=String(index+1).padStart(2,"0");
  $("#awCurrentTitle").textContent=(d.customTitle||t?.title||"Diligencia").toUpperCase();
  $("#awEditableDocument").innerHTML=d.content||t?.body||"";
  $("#awSourceNote").textContent=`Plantilla orientativa: ${t?.detail||"Revisar y adaptar a los hechos."}`;
  awRenderDiligences();
}
function awFilteredTemplates(){
  const q=normalize($("#awLibrarySearch").value);
  const cat=$("#awCategorySelect").value;
  return AW_TEMPLATES.filter(t=>(cat==="all"||t.category===cat)&&(!q||normalize(t.title+" "+t.detail).includes(q)));
}
function awRenderLibrary(){
  const list=$("#awExampleList"),items=awFilteredTemplates();list.innerHTML="";
  items.forEach((t,i)=>{
    const b=document.createElement("button");b.className="aw-example-item"+(awSelectedTemplate.id===t.id?" active":"");
    b.innerHTML=`<span>▤</span><strong>${t.title}</strong><b>☆</b>`;
    b.onclick=()=>{awSelectedTemplate=t;$("#awSelectedLibrary").textContent=t.title;$("#awDetailUse").textContent=t.title;$("#awDetailCategory").textContent=t.category;$("#awDetailDescription").textContent=t.detail;awRenderLibrary()};
    list.appendChild(b)
  });
  $("#awExamplesCount").textContent=`(${items.length})`;
}
function awUseSelected(){
  const current=awDiligences[awCurrentIndex];
  current.id=awSelectedTemplate.id;current.content=awSelectedTemplate.body;
  awSelectDiligence(awCurrentIndex);toast("Plantilla aplicada");
}
function awAdd(){
  const t=awSelectedTemplate||AW_TEMPLATES[0];
  awDiligences.push({id:t.id,content:t.body,date:new Date().toLocaleString("es-ES",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})});
  awSelectDiligence(awDiligences.length-1);
}
function awDuplicate(){
  const d=awDiligences[awCurrentIndex];awDiligences.splice(awCurrentIndex+1,0,{...d});
  awSelectDiligence(awCurrentIndex+1);toast("Diligencia duplicada");
}
function awDelete(){
  if(awDiligences.length<=1){toast("El atestado debe conservar al menos una diligencia");return}
  awDiligences.splice(awCurrentIndex,1);awCurrentIndex=Math.max(0,awCurrentIndex-1);awSelectDiligence(awCurrentIndex);toast("Diligencia eliminada");
}
function awRenderRecommendations(){
  const ids=["sintomas","alcoholemia","derechos","efectos","citacion","vehiculo","remision"];
  const box=$("#awRecommendedCards");box.innerHTML="";
  ids.forEach(id=>{const t=awTemplate(id),b=document.createElement("button");b.className="aw-rec-card";b.textContent="▤  "+t.title;b.onclick=()=>{awSelectedTemplate=t;awAdd()};box.appendChild(b)})
}
function awShowGeneric(title,description){
  $("#awDiligenceView").hidden=true;$("#awGenericView").hidden=false;$("#awGenericTitle").textContent=title;$("#awGenericDescription").textContent=description;
}
function awShowDiligences(){$("#awGenericView").hidden=true;$("#awDiligenceView").hidden=false}

function awOpenDialog(id){const el=document.getElementById(id);if(el && !el.open)el.showModal()}
function awLoadProfile(){
  const p=JSON.parse(localStorage.getItem("tcp-aw-profile")||'{"name":"Agente","tip":"1070","role":"Agente instructor","unit":"Policía Local"}');
  $("#awProfileName").value=p.name||"Agente";$("#awProfileTip").value=p.tip||"";$("#awProfileRole").value=p.role||"";$("#awProfileUnit").value=p.unit||"";
  document.querySelector(".aw-user strong").textContent=p.name||"Agente";
  document.querySelector(".aw-user small").textContent=p.role||"Perfil instructor";
  document.querySelector(".aw-avatar").textContent=(p.name||"AG").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
}
function awLoadSettings(){
  const s=JSON.parse(localStorage.getItem("tcp-aw-settings")||'{"autosave":true,"highlight":true,"compact":true}');
  $("#awAutoSave").checked=s.autosave!==false;$("#awHighlightVars").checked=s.highlight!==false;$("#awCompactMobile").checked=s.compact!==false;
  $("#atestadosWorkspace").classList.toggle("aw-no-highlight",!s.highlight);
}
function awPopulateAddTemplates(){
  const sel=$("#awAddTemplateSelect");sel.innerHTML="";
  AW_TEMPLATES.forEach(t=>{const o=document.createElement("option");o.value=t.id;o.textContent=t.title;sel.appendChild(o)});
}
function awCreateFromDialog(){
  const t=awTemplate($("#awAddTemplateSelect").value)||AW_TEMPLATES[0];
  const custom=$("#awAddCustomTitle").value.trim();
  awDiligences.push({id:t.id,customTitle:custom,content:t.body,date:new Date().toLocaleString("es-ES")});
  document.getElementById("awAddDialog").close();
  awSelectDiligence(awDiligences.length-1);awSave();
}

async function clearTrafficCopCaches(){
  try{
    if("serviceWorker" in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      for(const reg of regs) await reg.unregister();
    }
    if("caches" in window){
      const keys=await caches.keys();
      await Promise.all(keys.map(key=>caches.delete(key)));
    }
  }catch(error){console.warn("No se pudo limpiar la caché antigua",error)}
}

function awOperationalViews(){
  const descriptions={
    "home":["Inicio del gestor","Resumen del atestado activo, accesos rápidos y últimas diligencias."],
    "my-cases":["Mis atestados","Listado local de atestados guardados en este dispositivo."],
    "new-case":["Nuevo atestado","Crea y edita el expediente actualmente abierto."],
    "case-templates":["Plantillas de atestados","Selecciona una estructura inicial según el tipo de actuación."],
    "library":["Biblioteca de diligencias","Busca, revisa y aplica ejemplos de diligencias."],
    "favorites":["Mis favoritas","Plantillas señaladas para acceso rápido."],
    "my-templates":["Mis plantillas","Modelos personalizados guardados por el agente."],
    "shared":["Plantillas compartidas","Espacio preparado para plantillas de la unidad cuando exista servidor."]
  };

  document.querySelectorAll("[data-aw-nav]").forEach(button=>{
    button.onclick=()=>{
      document.querySelectorAll(".aw-sidebar button").forEach(x=>x.classList.toggle("active",x===button));
      const key=button.dataset.awNav;
      if(key==="new-case"||key==="library"){
        awShowDiligences();
      }else{
        const [title,desc]=descriptions[key]||[button.textContent.trim(),"Módulo operativo del gestor."];
        awShowGeneric(title,desc);
      }
      $("#atestadosWorkspace").classList.remove("aw-menu-open");
    };
  });

  const tabText={
    general:"Datos generales del atestado: número, fecha, lugar, instructor, secretario y naturaleza de los hechos.",
    documents:"Gestión de documentos, actas, consultas, informes y anexos incorporados.",
    persons:"Personas relacionadas: investigados, detenidos, denunciantes, víctimas y testigos.",
    vehicles:"Vehículos implicados, documentación, situación administrativa y medidas adoptadas.",
    effects:"Objetos y efectos intervenidos, descripción, embalaje y cadena de custodia.",
    observations:"Notas internas y comprobaciones pendientes del instructor."
  };

  document.querySelectorAll("[data-aw-tab]").forEach(button=>{
    button.onclick=()=>{
      document.querySelectorAll(".aw-tabs button").forEach(x=>x.classList.toggle("active",x===button));
      const key=button.dataset.awTab;
      if(key==="diligences") awShowDiligencesEnhanced();
      else if(["cover","annexes","persons","vehicles","effects","review"].includes(key)) awRenderStructure(key);
      else awShowGeneric(button.textContent.trim(),tabText[key]||"Módulo de gestión del atestado.");
    };
  });
}


let awAnnexes=[];
function awPlainTextFromHtml(html){
  const temp=document.createElement("div");temp.innerHTML=html;
  temp.querySelectorAll("br").forEach(x=>x.replaceWith("\n"));
  temp.querySelectorAll("p,h1,h2,h3,h4,li,tr").forEach(x=>x.append("\n"));
  return temp.textContent.replace(/\u00a0/g," ").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
}
async function awCopyForNipal(){
  if(awDiligences[awCurrentIndex])awDiligences[awCurrentIndex].content=$("#awEditableDocument").innerHTML;
  const d=awDiligences[awCurrentIndex];
  const title=(d.customTitle||awTemplate(d.id)?.title||"Diligencia").toUpperCase();
  const text=title+"\n\n"+awPlainTextFromHtml(d.content);
  try{await navigator.clipboard.writeText(text)}catch{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove()}
  const n=document.createElement("div");n.className="aw-copy-toast";n.textContent="Copiado para pegar en NIPal";document.body.appendChild(n);setTimeout(()=>n.remove(),1800);
}
function awReviewAtestado(){
  if(awDiligences[awCurrentIndex])awDiligences[awCurrentIndex].content=$("#awEditableDocument").innerHTML;
  const results=[];
  const ids=awDiligences.map(d=>d.id);
  const unresolved=awDiligences.reduce((n,d)=>n+((d.content.match(/\{\{[^}]+\}\}/g)||[]).length),0);
  results.push({type:ids.some(x=>x.startsWith("inicio")||x==="comparecencia")?"ok":"error",title:"Inicio del atestado",detail:ids.some(x=>x.startsWith("inicio")||x==="comparecencia")?"Existe comparecencia o diligencia de inicio.":"Falta una comparecencia o diligencia de inicio."});
  results.push({type:ids.includes("remision")?"ok":"error",title:"Diligencia de remisión",detail:ids.includes("remision")?"Está incluida en el cuerpo del atestado.":"Debe revisarse si corresponde incorporar la diligencia de remisión."});
  results.push({type:unresolved===0?"ok":"warn",title:"Variables pendientes",detail:unresolved===0?"No se detectan variables {{...}} sin completar.":`Quedan ${unresolved} variables sin sustituir.`});
  results.push({type:awAnnexes.length?"ok":"warn",title:"Anexos",detail:awAnnexes.length?`${awAnnexes.length} anexos registrados.`:"No hay anexos registrados. Comprueba si deben adjuntarse actas, minutas, informes o fotografías."});
  results.push({type:"warn",title:"Revisión policial",detail:"Comprueba cronología, identidad, derechos, firmas, cadena de custodia y concordancia entre diligencias y anexos."});
  const box=$("#awReviewResults");box.innerHTML=results.map(r=>`<div class="aw-review-item ${r.type}"><span>${r.type==="ok"?"✓":r.type==="error"?"!":"△"}</span><div><strong>${r.title}</strong><small>${r.detail}</small></div></div>`).join("");
}
function awRenderStructure(tab){
  $("#awDiligenceView").hidden=true;$("#awGenericView").hidden=true;$("#awReviewPanel").hidden=true;
  let old=document.getElementById("awStructureView");if(old)old.remove();
  if(tab==="review"){$("#awReviewPanel").hidden=false;awReviewAtestado();return}
  const sec=document.createElement("section");sec.id="awStructureView";sec.className="aw-structure-view";
  if(tab==="cover")sec.innerHTML=`<div class="aw-structure-card"><h3>Carátula del atestado</h3><div class="aw-structure-grid"><label>Número de atestado<input value="2026/00215"></label><label>Fecha<input type="date" value="2026-08-02"></label><label>Hora<input type="time" value="03:15"></label><label>Localidad<input value="Palamós (Girona)"></label><label>Instructor<input value="Agente instructor"></label><label>Secretario<input value="Agente secretario"></label><label class="full">Hecho o calificación inicial<textarea rows="3" placeholder="Descripción inicial y prudente, sin sustituir la valoración judicial."></textarea></label><label class="full">Órgano de destino<input placeholder="Juzgado / Fiscalía / unidad receptora"></label></div></div>`;
  if(tab==="annexes")sec.innerHTML=`<div class="aw-structure-card"><h3>Anexos del atestado</h3><p>Minutas, actas, informes médicos, fotografías, oficios, citaciones, facturas y otros documentos.</p><div id="awAnnexList" class="aw-annex-list"></div><div class="aw-add-annex"><select id="awAnnexType"><option>Minuta policial</option><option>Acta</option><option>Informe médico</option><option>Fotografías / vídeo</option><option>Oficio o citación</option><option>Factura / presupuesto</option><option>Dictamen</option><option>Otro documento</option></select><input id="awAnnexName" placeholder="Descripción o referencia"><input id="awAnnexPerson" placeholder="Persona relacionada"><button id="awAddAnnexButton">AÑADIR</button></div></div>`;
  if(["persons","vehicles","effects"].includes(tab))sec.innerHTML=`<div class="aw-structure-card"><h3>${tab==="persons"?"Personas":tab==="vehicles"?"Vehículos":"Objetos y efectos"}</h3><p>Este registro permite mantener una referencia coherente en todas las diligencias. No sustituye las bases policiales ni el sistema corporativo.</p><div class="aw-structure-grid"><label>Tipo / rol<select><option>${tab==="persons"?"Investigado / detenido / víctima / testigo":"Elemento relacionado"}</option></select></label><label>Identificación<input placeholder="Nombre, matrícula o referencia"></label><label>Estado<input placeholder="Situación actual"></label><label class="full">Descripción detallada<textarea rows="5"></textarea></label></div></div>`;
  $(".aw-main").insertBefore(sec,$(".aw-recommendations"));
  if(tab==="annexes"){awRenderAnnexes();$("#awAddAnnexButton").onclick=()=>{const name=$("#awAnnexName").value.trim();if(!name){toast("Escribe una descripción del anexo");return}awAnnexes.push({type:$("#awAnnexType").value,name,person:$("#awAnnexPerson").value.trim()});awRenderAnnexes();$("#awAnnexName").value="";$("#awAnnexPerson").value="";localStorage.setItem("tcp-aw-annexes",JSON.stringify(awAnnexes))}}
}
function awRenderAnnexes(){
  try{if(!awAnnexes.length)awAnnexes=JSON.parse(localStorage.getItem("tcp-aw-annexes")||"[]")}catch{}
  const box=$("#awAnnexList");if(!box)return;box.innerHTML=awAnnexes.length?awAnnexes.map((a,i)=>`<div class="aw-annex-row"><b>${String(i+1).padStart(2,"0")}</b><span>${a.name}</span><span>${a.type}</span><span>${a.person||"—"}</span><button data-remove-annex="${i}">Eliminar</button></div>`).join(""):"<p>No hay anexos registrados.</p>";
  box.querySelectorAll("[data-remove-annex]").forEach(b=>b.onclick=()=>{awAnnexes.splice(Number(b.dataset.removeAnnex),1);localStorage.setItem("tcp-aw-annexes",JSON.stringify(awAnnexes));awRenderAnnexes()});
  $("#awAnnexCount").textContent=`(${awAnnexes.length})`;
}
function awShowDiligencesEnhanced(){
  document.getElementById("awStructureView")?.remove();$("#awReviewPanel").hidden=true;awShowDiligences();
}

function setupFullscreenAndButtons(){
  clearTrafficCopCaches();
  try{awAnnexes=JSON.parse(localStorage.getItem("tcp-aw-annexes")||"[]")}catch{awAnnexes=[]}
  $("#awCopyNipalTop").onclick=awCopyForNipal;
  $("#awCopyNipal").onclick=awCopyForNipal;
  $("#awRunReview").onclick=awReviewAtestado;

  $("#awTopBackButton").onclick=awClose;
  $("#awTopSettings").onclick=()=>awOpenDialog("awSettingsDialog");
  $("#awTopHelp").onclick=()=>alert(
    "GESTOR DE ATESTADOS\n\n"+
    "1. Selecciona una diligencia en la columna izquierda.\n"+
    "2. Edita el contenido en el documento central.\n"+
    "3. Usa la biblioteca para cambiar o añadir plantillas.\n"+
    "4. Guarda el expediente antes de salir.\n\n"+
    "Las plantillas son orientativas y deben revisarse."
  );

  $("#awPreview").onclick=()=>{
    awDiligences[awCurrentIndex].content=$("#awEditableDocument").innerHTML;
    const preview=window.open("","_blank");
    if(!preview){toast("El navegador ha bloqueado la vista previa");return}
    preview.document.write(`<html><head><meta charset="utf-8"><title>Vista previa</title>
      <style>body{font-family:Arial;margin:40px;color:#111}article{max-width:850px;margin:auto 0 55px;page-break-after:always;line-height:1.55}h2{border-bottom:1px solid #aaa;padding-bottom:8px}</style>
      </head><body>${awDiligences.map((d,i)=>`<article><h2>${String(i+1).padStart(2,"0")} · ${d.customTitle||awTemplate(d.id)?.title||"Diligencia"}</h2>${d.content}</article>`).join("")}</body></html>`);
    preview.document.close();
  };

  $("#awExport").onclick=()=>{
    awDiligences[awCurrentIndex].content=$("#awEditableDocument").innerHTML;
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>Atestado</title><style>body{font-family:Arial;margin:40px}article{page-break-after:always;line-height:1.55}</style></head><body>${awDiligences.map((d,i)=>`<article><h2>${String(i+1).padStart(2,"0")} · ${d.customTitle||awTemplate(d.id)?.title||"Diligencia"}</h2>${d.content}</article>`).join("")}</body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="Atestado_2026_00215.html";a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),500);
    toast("Atestado exportado");
  };

  $("#awSeeAll").onclick=()=>{
    awShowDiligences();
    if(window.innerWidth<=1180){
      toast("En pantalla reducida, la biblioteca se abre desde Cambiar plantilla");
    }else{
      $("#awLibrarySearch").focus();
    }
  };

  awOperationalViews();
}

function setupAtestadosPolish(){
  awLoadProfile();awLoadSettings();awPopulateAddTemplates();

  $("#awProfileButton").onclick=()=>awOpenDialog("awProfileDialog");
  $("#awSettingsButton").onclick=()=>awOpenDialog("awSettingsDialog");
  $(".aw-user").style.cursor="pointer";
  $(".aw-user").onclick=()=>awOpenDialog("awProfileDialog");

  $("#awProfileSave").onclick=()=>{
    const p={name:$("#awProfileName").value.trim()||"Agente",tip:$("#awProfileTip").value.trim(),role:$("#awProfileRole").value.trim(),unit:$("#awProfileUnit").value.trim()};
    localStorage.setItem("tcp-aw-profile",JSON.stringify(p));awLoadProfile();document.getElementById("awProfileDialog").close();toast("Perfil guardado");
  };
  $("#awSettingsSave").onclick=()=>{
    const s={autosave:$("#awAutoSave").checked,highlight:$("#awHighlightVars").checked,compact:$("#awCompactMobile").checked};
    localStorage.setItem("tcp-aw-settings",JSON.stringify(s));awLoadSettings();document.getElementById("awSettingsDialog").close();toast("Configuración guardada");
  };

  $("#awAddDiligence").onclick=()=>awOpenDialog("awAddDialog");
  $("#awAddDiligenceBottom").onclick=()=>awOpenDialog("awAddDialog");
  $("#awConfirmAdd").onclick=awCreateFromDialog;

  $("#awOrderDiligences").onclick=()=>{
    awDiligences.sort((a,b)=>(awTemplate(a.id)?.title||"").localeCompare(awTemplate(b.id)?.title||""));
    awCurrentIndex=0;awSelectDiligence(0);awSave();toast("Diligencias ordenadas alfabéticamente");
  };

  $("#awSignatures").onclick=()=>toast("Las firmas digitales requieren identificación segura y servidor; la interfaz queda preparada.");
  $("#awHistory").onclick=()=>{
    const saved=JSON.parse(localStorage.getItem("tcp-aw-case")||"{}");
    const when=saved.savedAt?new Date(saved.savedAt).toLocaleString("es-ES"):"sin guardados";
    alert("Historial local\n\nÚltimo guardado: "+when+"\nDiligencias: "+awDiligences.length);
  };

  const autoSave=()=>{const s=JSON.parse(localStorage.getItem("tcp-aw-settings")||'{"autosave":true}');if(s.autosave){awDiligences[awCurrentIndex].content=$("#awEditableDocument").innerHTML;awSave()}};
  let timer;
  $("#awEditableDocument").addEventListener("input",()=>{clearTimeout(timer);timer=setTimeout(autoSave,900)});
}

function setupAtestadosManager(){
  document.querySelectorAll("[data-atestados-open]").forEach(b=>{b.onclick=e=>{e.preventDefault();e.stopPropagation();document.getElementById("sideDrawer")?.classList.remove("open");document.getElementById("drawerBackdrop")?.classList.remove("open");awOpen()}});
  $("#awBackToApp").onclick=awClose;$("#awMenuButton").onclick=()=>$("#atestadosWorkspace").classList.toggle("aw-menu-open");
  $("#awSave").onclick=awSave;$("#awSaveDiligence").onclick=()=>{awDiligences[awCurrentIndex].content=$("#awEditableDocument").innerHTML;awSave()};
  $("#awAddDiligence").onclick=awAdd;$("#awAddDiligenceBottom").onclick=awAdd;$("#awDuplicateDiligence").onclick=awDuplicate;$("#awDeleteDiligence").onclick=awDelete;
  $("#awUseExample").onclick=awUseSelected;$("#awChangeTemplate").onclick=()=>{$("#awLibrarySearch").focus();toast("Selecciona una plantilla de la biblioteca")};
  $("#awLibrarySearch").oninput=awRenderLibrary;$("#awCategorySelect").onchange=awRenderLibrary;
  $("#awGlobalSearch").oninput=e=>{$("#awLibrarySearch").value=e.target.value;awRenderLibrary()};
  $("#awPreview").onclick=()=>{const w=window.open("","_blank");w.document.write(`<html><head><title>Vista previa del atestado</title><style>body{font-family:Arial;padding:40px}article{page-break-after:always;line-height:1.55}</style></head><body>${awDiligences.map((d,i)=>`<article><h2>${String(i+1).padStart(2,"0")} - ${awTemplate(d.id).title}</h2>${i===awCurrentIndex?$("#awEditableDocument").innerHTML:d.content}</article>`).join("")}</body></html>`);w.document.close()};
  $("#awExport").onclick=()=>{awDiligences[awCurrentIndex].content=$("#awEditableDocument").innerHTML;const text=awDiligences.map((d,i)=>`${String(i+1).padStart(2,"0")} - ${awTemplate(d.id).title}\n\n${d.content.replace(/<[^>]+>/g," ")}\n\n`).join("");const blob=new Blob([text],{type:"text/plain;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="Atestado_2026_00215.txt";a.click();URL.revokeObjectURL(a.href)};
  $("#awSignatures").onclick=()=>toast("Módulo de firmas preparado para una futura versión segura");
  $("#awFavCurrent").onclick=()=>{awSelectedTemplate=awTemplate(awDiligences[awCurrentIndex].id);toast("Plantilla añadida a favoritas")};
  $("#awHistory").onclick=()=>toast("Último guardado: "+(JSON.parse(localStorage.getItem("tcp-aw-case")||"{}").savedAt||"sin guardados"));
  $("#awOrderDiligences").onclick=()=>toast("Arrastra y ordena: se incorporará en la siguiente mejora");
  $("#awExamplePreview").onclick=()=>{const w=window.open("","_blank");w.document.write(`<html><body style="font-family:Arial;padding:40px">${awSelectedTemplate.body}</body></html>`);w.document.close()};
  $("#awSeeAll").onclick=()=>{$("#awLibrarySearch").focus();$("#awLibrarySearch").scrollIntoView({behavior:"smooth"})};
  $("#awReturnDiligences").onclick=awShowDiligences;
  document.querySelectorAll("[data-aw-tab]").forEach(b=>b.onclick=()=>{document.querySelectorAll(".aw-tabs button").forEach(x=>x.classList.toggle("active",x===b));const key=b.dataset.awTab;if(key==="diligences")awShowDiligencesEnhanced();else if(["cover","annexes","persons","vehicles","effects","review"].includes(key))awRenderStructure(key);else awShowGeneric(b.textContent.trim(),"Módulo de gestión del atestado.")});
  document.querySelectorAll("[data-aw-nav]").forEach(b=>b.onclick=()=>{document.querySelectorAll(".aw-sidebar button").forEach(x=>x.classList.toggle("active",x===b));if(["library","new-case"].includes(b.dataset.awNav))awShowDiligences();else awShowGeneric(b.textContent.trim(),"Vista de gestión preparada para la siguiente fase del proyecto.")});
  document.querySelectorAll(".aw-editor-toolbar [data-command]").forEach(b=>b.onclick=()=>document.execCommand(b.dataset.command,false,null));
  $("#awInsertVariable").onclick=()=>document.execCommand("insertText",false,"{{VARIABLE}}");
  document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"&&!$("#atestadosWorkspace").hidden){e.preventDefault();$("#awGlobalSearch").focus()}});
  $("#awAiButton").onclick=()=>{awShowDiligences();$("#awLibrarySearch").focus();toast("Describe la diligencia que necesitas en el buscador")};
}

function setupDesktopMenuFix(){
  const menuButton=document.getElementById("menuButton");
  const sideDrawer=document.getElementById("sideDrawer");
  const backdrop=document.getElementById("drawerBackdrop");

  if(!menuButton) return;

  const applyDesktopBehaviour=()=>{
    if(window.innerWidth>=1100){
      sideDrawer?.classList.remove("open");
      backdrop?.classList.remove("open");
      document.body.classList.remove("drawer-open");

      menuButton.onclick=()=>{
        document.body.classList.toggle("rail-collapsed");
        localStorage.setItem(
          "tcp-rail-collapsed",
          document.body.classList.contains("rail-collapsed") ? "1" : "0"
        );
      };

      if(localStorage.getItem("tcp-rail-collapsed")==="1"){
        document.body.classList.add("rail-collapsed");
      }
    }else{
      document.body.classList.remove("rail-collapsed");
      setupDrawer();
    }
  };

  applyDesktopBehaviour();
  window.addEventListener("resize",applyDesktopBehaviour);
}

function setupDesktopRail(){
  document.querySelectorAll("[data-rail-action]").forEach(button=>{
    button.onclick=()=>{
      document.querySelectorAll(".desktop-police-rail nav button").forEach(item=>item.classList.toggle("active",item===button));
      const action=button.dataset.railAction;
      if(action==="home") window.scrollTo({top:0,behavior:"smooth"});
      if(action==="catalog") $("#catalogSection")?.scrollIntoView({behavior:"smooth"});
      if(action==="ai") openDialog("#assistantDialog");
      if(action==="more") $("#menuButton")?.click();
    };
  });
}

function init(){setupCatalog();setupDrawer();setupDrawerBehaviourFix();setupDesktopMenuFix();setupAI();setupDocuments();setupSuite();setupNav();setupTicket();setupAtestados();setupAtestadosManager();setupAtestadosPolish();setupFullscreenAndButtons();setupDesktopRail();console.log('TrafficCop Pro 3.5.0 iniciado correctamente')}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
