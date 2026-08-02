
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


const SC_TEMPLATES=[
 {id:"d10",code:"D10",category:"lopsc",type:"Denuncia administrativa",title:"Denuncia por presuntas infracciones a la LO 4/2015",help:["Completar todos los datos disponibles de la persona presuntamente infractora.","Indicar fecha, hora, lugar específico, agentes actuantes y servicio.","Seleccionar el artículo aplicable y describir conductas concretas.","Señalar si existe intervención de arma, sustancia, instrumento o utensilio.","En menores, aplicar las comunicaciones y campos específicos del procedimiento."],fields:[
  ["numero","Número de acta","text"],["comisaria","Comisaría donde se presenta","text"],["fecha","Fecha","date"],["hora","Hora","time"],["agentes","Agentes actuantes / TIP","text"],["servicio","Servicio","text"],["persona","Persona infractora","text"],["documento","Documento de identidad","text"],["domicilio","Domicilio actual para notificaciones","text"],["telefono","Teléfono","text"],["lugar","Lugar específico del hecho","text"],["articulo","Artículo LO 4/2015","select"],["conducta","Conducta observada","textarea","full"],["requerimientos","Requerimientos, advertencias o comprobaciones","textarea","full"],["intervencion","Armas, sustancias, objetos o instrumentos intervenidos","textarea","full"],["observaciones","Observaciones adicionales","textarea","full"]
 ],options:{articulo:["36.6 · Desobediencia/resistencia/negativa a identificarse","36.10 · Armas prohibidas o uso irregular","36.16 · Consumo o tenencia de drogas en lugar público","36.19 · Tolerancia del consumo o tráfico en local público","37.2 · Exhibición intimidatoria de objeto peligroso","37.4 · Falta de respeto o consideración a FCS","37.7 · Venta ambulante no autorizada","37.13 · Daños o deslucimientos","37.17 · Consumo de alcohol con perturbación grave","Otro artículo"]}},
 {id:"d10b",code:"D10b",category:"lopsc",type:"Intervención temporal",title:"Acta de intervención temporal de objeto peligroso",help:["Para objetos peligrosos o susceptibles de causar riesgo.","No utilizar para intervenir armas.","Describir detalladamente objeto, marca, material, color, dimensiones y estado.","Indicar el motivo objetivo de la intervención y el lugar de depósito.","Registrar la posterior recogida o entrega mediante el documento correspondiente."],fields:[
  ["numero","Número de acta","text"],["fecha","Fecha","date"],["hora","Hora","time"],["lugar","Lugar de intervención","text"],["agentes","Agentes actuantes / TIP","text"],["persona","Persona relacionada","text"],["documento","Documento identificativo","text"],["objeto","Objeto intervenido","text"],["descripcion","Descripción detallada del objeto","textarea","full"],["motivo","Motivo concreto de la intervención temporal","textarea","full"],["deposito","Lugar de depósito y registro","text"],["informacion","Información facilitada a la persona","textarea","full"]
 ]},
 {id:"a10",code:"A10",category:"lopsc",type:"Acta abierta",title:"Acta abierta de constatación de hechos",help:["Modelo abierto para hechos concretos que requieren una descripción amplia.","Identificar lugar, persona requerida y testigos cuando existan.","Diferenciar lo observado por los agentes de lo manifestado por terceros.","Puede utilizarse para recogida de sustancia sin propietario, intervención documental u otras circunstancias.","Redactar en tercera persona y orden cronológico."],fields:[
  ["diligencias","Número de diligencias","text"],["municipio","Municipio y comarca","text"],["fecha","Fecha","date"],["hora","Hora","time"],["instructor","Instructor/a","text"],["secretario","Secretario/a","text"],["destino","Destino de los agentes","text"],["lugar","Dirección y tipo de lugar","text"],["persona","Persona requerida","text"],["documento","Documento identificativo","text"],["testigos","Testigos","textarea","full"],["contenido","Contenido del acta","textarea","full"]
 ]},
 {id:"g31",code:"G31",category:"hurto",type:"Minuta delito leve",title:"Minuta policial por delito leve de hurto en establecimiento",help:["Relacionar D24 y A57 cuando se hayan recogido.","Detallar los objetos entregados y los útiles para inutilizar sistemas de protección.","Completar filiación y situación de la persona denunciada.","Hacer constar circunstancias del hecho y valoración de los productos.","Revisar citaciones N09 y N10 cuando proceda."],fields:[
  ["atestat","Número de atestado","text"],["establecimiento","Establecimiento y dirección","text"],["fecha","Fecha","date"],["hora","Hora","time"],["agentes","Agentes / servicio","text"],["denunciado","Persona denunciada","text"],["documento","Documento identificativo","text"],["objetos","Objetos sustraídos y valor","textarea","full"],["utiles","Objetos o útiles entregados","textarea","full"],["situacion","Situación de la persona denunciada","select"],["circunstancias","Circunstancias del hecho","textarea","full"]
 ],options:{situacion:["Resta en libertad y citada para JIDL","Trasladada a dependencias para identificación","Detenida conforme al procedimiento aplicable","Menor entregado a responsables legales","Otra situación"]}},
 {id:"d24",code:"D24",category:"hurto",type:"Denuncia",title:"Denuncia de hurto en establecimiento comercial",help:["Identificar la calidad del denunciante: responsable, vigilante, cajero, dependiente u otra.","Relacionar los objetos, su valor y la forma de detección.","Indicar cámaras, testigos, tiquet y recuperación de productos."],fields:[
  ["atestat","Número de atestado","text"],["establecimiento","Establecimiento","text"],["fecha","Fecha","date"],["hora","Hora","time"],["denunciante","Persona denunciante","text"],["calidad","Calidad del denunciante","text"],["denunciado","Persona denunciada","text"],["objetos","Relación de objetos","textarea","full"],["hechos","Relato de los hechos","textarea","full"]
 ]},
 {id:"a57",code:"A57",category:"hurto",type:"Acta perjudicado",title:"Declaración de persona perjudicada por sustracción",help:["Indicar si la persona perjudicada es también testigo.","Hacer constar el precio de venta al público.","Registrar la información de derechos y la devolución en depósito judicial cuando proceda.","Relacionar el tiquet o justificante."],fields:[
  ["atestat","Número de atestado","text"],["establecimiento","Establecimiento","text"],["fecha","Fecha","date"],["hora","Hora","time"],["perjudicado","Persona perjudicada / responsable","text"],["documento","Documento identificativo","text"],["valor","Valor total de venta al público","text"],["objetos","Objetos y tiquet","textarea","full"],["manifestacion","Manifestación","textarea","full"]
 ]},
 {id:"a56",code:"A56",category:"hurto",type:"Entrega de efectos",title:"Acta de reconocimiento y entrega de efectos",help:["Identificar a la persona declarante.","Describir individualmente cada efecto reconocido.","Indicar que reconoce los objetos sin duda como de su propiedad.","Documentar la entrega y firmas."],fields:[
  ["diligencias","Número de diligencias","text"],["fecha","Fecha","date"],["persona","Persona declarante","text"],["documento","Documento identificativo","text"],["efectos","Efectos reconocidos y entregados","textarea","full"],["observaciones","Observaciones","textarea","full"]
 ]},
 {id:"n09",code:"N09",category:"hurto",type:"Información de derechos",title:"Información de derechos a denunciado por delito leve (JIDL)",help:["Identificar unidad instructora y persona denunciada.","Describir los hechos atribuidos de forma comprensible.","Entregar copia y registrar fecha, hora y firmas."],fields:[
  ["diligencias","Número de diligencias","text"],["unidad","Unidad instructora","text"],["persona","Persona denunciada","text"],["documento","Documento identificativo","text"],["hechos","Hechos atribuidos","textarea","full"],["entrega","Fecha y hora de entrega","text"]
 ]},
 {id:"n10",code:"N10",category:"hurto",type:"Citación judicial",title:"Citación para juicio inmediato de delito leve (JIDL)",help:["Indicar calidad procesal de la persona citada.","Completar órgano judicial, dirección, fecha y hora.","Informar de las consecuencias de la incomparecencia y derechos correspondientes."],fields:[
  ["diligencias","Número de diligencias","text"],["unidad","Unidad instructora","text"],["persona","Persona citada","text"],["documento","Documento identificativo","text"],["calidad","Calidad en la citación","select"],["juzgado","Dependencias judiciales","text"],["fecha_citacion","Fecha de comparecencia","date"],["hora_citacion","Hora de comparecencia","time"],["entrega","Lugar, fecha y hora de entrega","text"]
 ],options:{calidad:["Denunciado/a","Perjudicado/a","Denunciante","Testigo","Perito/a o facultativo/a"]}},
 {id:"g16",code:"G16",category:"minuta",type:"Minuta con detenido",title:"Minuta policial con personas detenidas",help:["Identificar a la persona detenida y los agentes.","Indicar hora y motivo de detención e información de derechos.","Separar: «I lliuren», motivos y relato cronológico.","Describir efectos y documentos entregados."],fields:[
  ["diligencias","Número de diligencias","text"],["municipio","Municipio, fecha y hora","text"],["agentes","Agentes / TIP","text"],["detenido","Persona detenida","text"],["documento","Documento identificativo","text"],["motivo","Motivo de detención","textarea","full"],["lliuren","Efectos y documentos que se entregan","textarea","full"],["relato","Relato cronológico","textarea","full"]
 ]},
 {id:"g17",code:"G17",category:"minuta",type:"Minuta sin detenido",title:"Minuta policial sin personas detenidas",help:["Identificar personas y agentes.","Relacionar efectos o documentos que se entregan.","Describir motivos y hechos cronológicamente.","Indicar gestiones y medidas adoptadas."],fields:[
  ["diligencias","Número de diligencias","text"],["municipio","Municipio, fecha y hora","text"],["agentes","Agentes / TIP","text"],["identificado","Persona identificada","text"],["documento","Documento identificativo","text"],["lliuren","Efectos y documentos que se entregan","textarea","full"],["motivo","Motivo de la actuación","textarea","full"],["relato","Relato cronológico","textarea","full"]
 ]}
];

const SC_CASES=[
 {article:"36.6",severity:"grave",title:"Desobediencia, resistencia o negativa a identificarse",text:"Describir requerimientos claros, reiteración, respuesta de la persona y ausencia de violencia suficiente para constituir delito.",template:"d10"},
 {article:"36.10",severity:"grave",title:"Armas prohibidas o utilización irregular",text:"Individualizar el arma, circunstancias de porte/exhibición/uso, licencia y medidas de intervención.",template:"d10"},
 {article:"36.16",severity:"grave",title:"Consumo o tenencia de drogas en lugar público",text:"Indicar lugar público, sustancia, envoltorio, localización exacta, persona y número de precinto o acta.",template:"d10"},
 {article:"36.19",severity:"grave",title:"Tolerancia del consumo o tráfico en local público",text:"Identificar responsable, hechos observados y falta de medidas para impedirlos. Valorar normativa de espectáculos.",template:"a10"},
 {article:"37.2",severity:"leve",title:"Exhibición intimidatoria de objeto peligroso",text:"Debe existir finalidad intimidatoria abstracta, sin amenaza individualizada. Valorar intervención temporal D10b.",template:"d10b"},
 {article:"37.4",severity:"leve",title:"Falta de respeto o consideración a agentes",text:"Transcribir expresiones concretas, contexto, destinatarios y actuación policial en curso.",template:"d10"},
 {article:"37.7",severity:"leve",title:"Venta ambulante no autorizada",text:"Identificar actividad, productos, lugar y posible concurrencia de ordenanza municipal.",template:"d10"},
 {article:"37.13",severity:"leve",title:"Daños o deslucimientos",text:"Describir bien afectado, ubicación, entidad y si basta limpieza o requiere reparación.",template:"d10"},
 {article:"Operativa",severity:"operativa",title:"Sustancia hallada sin propietario",text:"A10 con lugar exacto, descripción de sustancia, recogida, embalaje y motivo por el que no se atribuye a persona concreta.",template:"a10"},
 {article:"Operativa",severity:"operativa",title:"Menor de 14 años",text:"Acta de denuncia, marca de menor, comunicación a responsables legales y tramitación conforme al procedimiento.",template:"d10"}
];

let scCurrentTemplate=SC_TEMPLATES[0];

function scOpen(){
  $("#scWorkspace").hidden=false;
  document.body.style.overflow="hidden";
  document.querySelector(".topbar")?.setAttribute("hidden","");
  document.querySelector(".desktop-police-rail")?.setAttribute("hidden","");
  document.querySelector(".bottomnav")?.setAttribute("hidden","");
  scShowView("dashboard");
  scRenderTemplates();
  scRenderCases();
  scRenderArticles();
  scSelectTemplate(scCurrentTemplate.id,false);
}

function scClose(){
  $("#scWorkspace").hidden=true;
  document.body.style.overflow="";
  document.querySelector(".topbar")?.removeAttribute("hidden");
  document.querySelector(".desktop-police-rail")?.removeAttribute("hidden");
  document.querySelector(".bottomnav")?.removeAttribute("hidden");
}

function scShowView(name){
  document.querySelectorAll("#scWorkspace .sc-view").forEach(v=>v.hidden=true);
  const map={dashboard:"#scDashboard",forms:"#scFormsView",library:"#scLibraryView",guide:"#scGuideView",weapons:"#scWeaponsView",review:"#scReviewView"};
  $(map[name]||map.dashboard).hidden=false;
  document.querySelectorAll("[data-sc-view]").forEach(b=>b.classList.toggle("active",b.dataset.scView===name));
  $("#scWorkspace").classList.remove("sc-menu-open");
}

function scTemplate(id){return SC_TEMPLATES.find(t=>t.id===id)}

function scRenderTemplates(){
  const box=$("#scTemplateItems");
  if(!box)return;
  const q=normalize($("#scTemplateSearch")?.value||"");
  const cat=$("#scCategoryFilter")?.value||"all";
  box.innerHTML="";
  SC_TEMPLATES.filter(t=>(cat==="all"||t.category===cat)&&(!q||normalize(`${t.code} ${t.title} ${t.type}`).includes(q))).forEach(t=>{
    const b=document.createElement("button");
    b.className="sc-template-item"+(scCurrentTemplate.id===t.id?" active":"");
    b.dataset.scTemplate=t.id;
    b.innerHTML=`<b>${t.code}</b><span><strong>${t.title}</strong><small>${t.type}</small></span><em>ABRIR</em>`;
    b.onclick=()=>scSelectTemplate(t.id);
    box.appendChild(b);
  });
}

function scSelectTemplate(id,show=true){
  const t=scTemplate(id);
  if(!t)return;
  scCurrentTemplate=t;
  if(show)scShowView("forms");
  $("#scCurrentCode").textContent=t.code;
  $("#scCurrentType").textContent=t.type.toUpperCase();
  $("#scCurrentTitle").textContent=t.title;
  $("#scHelpTitle").textContent=`${t.code} · ${t.title}`;
  $("#scHelpContent").innerHTML=`<div class="sc-model-note">Modelo de apoyo basado en los formularios y materiales aportados.</div><ul>${t.help.map(x=>`<li>${x}</li>`).join("")}</ul>`;
  const form=$("#scFormFields"); form.innerHTML="";
  t.fields.forEach(([name,label,type,cls])=>{
    const w=document.createElement("label");
    if(cls)w.className=cls;
    w.textContent=label;
    let e;
    if(type==="textarea"){e=document.createElement("textarea");e.rows=4}
    else if(type==="select"){e=document.createElement("select");(t.options?.[name]||[]).forEach(o=>{const op=document.createElement("option");op.value=o;op.textContent=o;e.appendChild(op)})}
    else{e=document.createElement("input");e.type=type}
    e.name=name;e.dataset.label=label;w.appendChild(e);form.appendChild(w);
  });
  $("#scOutput").value=localStorage.getItem(`tcp-sc-output-${id}`)||"";
  scRenderTemplates();
}

function scValues(){
  const v={};
  document.querySelectorAll("#scFormFields [name]").forEach(e=>v[e.name]=e.value.trim());
  return v;
}
const scDate=x=>x?x.split("-").reverse().join("/"):"__________";

function scBuildText(){
  const t=scCurrentTemplate,v=scValues();
  const common=`${t.code} · ${t.title.toUpperCase()}\n\n`;
  if(t.id==="d10")return common+`ACTA: ${v.numero||"__________"}\nCOMISARÍA: ${v.comisaria||"__________"}\nFECHA Y HORA: ${scDate(v.fecha)} · ${v.hora||"____"}\nAGENTES / TIP: ${v.agentes||"__________"}\nSERVICIO: ${v.servicio||"__________"}\n\nPERSONA PRESUNTAMENTE INFRACTORA\n${v.persona||"__________"} · ${v.documento||"__________"}\nDOMICILIO A EFECTOS DE NOTIFICACIÓN: ${v.domicilio||"__________"}\nTELÉFONO: ${v.telefono||"__________"}\n\nLUGAR DEL HECHO\n${v.lugar||"__________"}\n\nPRECEPTO: ${v.articulo||"__________"}\n\nHECHOS OBSERVADOS\n${v.conducta||"________________________________________________________________"}\n\nREQUERIMIENTOS Y COMPROBACIONES\n${v.requerimientos||"________________________________________________________________"}\n\nINTERVENCIÓN\n${v.intervencion||"No consta intervención de efectos."}\n\nOBSERVACIONES\n${v.observaciones||"Sin observaciones adicionales."}`;
  if(t.id==="d10b")return common+`NÚMERO: ${v.numero||"__________"}\nFECHA Y HORA: ${scDate(v.fecha)} · ${v.hora||"____"}\nLUGAR: ${v.lugar||"__________"}\nAGENTES / TIP: ${v.agentes||"__________"}\nPERSONA: ${v.persona||"__________"} · ${v.documento||"__________"}\n\nOBJETO INTERVENIDO\n${v.objeto||"__________"}\n${v.descripcion||"________________________________________________________________"}\n\nMOTIVO DE LA INTERVENCIÓN TEMPORAL\n${v.motivo||"________________________________________________________________"}\n\nDEPÓSITO / REGISTRO\n${v.deposito||"__________"}\n\nINFORMACIÓN FACILITADA\n${v.informacion||"________________________________________________________________"}\n\nADVERTENCIA: este modelo no se utiliza para la intervención de armas.`;
  if(t.id==="a10")return common+`DILIGENCIAS: ${v.diligencias||"__________"}\nMUNICIPIO / COMARCA: ${v.municipio||"__________"}\nFECHA Y HORA: ${scDate(v.fecha)} · ${v.hora||"____"}\nINSTRUCTOR/A: ${v.instructor||"__________"}\nSECRETARIO/A: ${v.secretario||"__________"}\nDESTINO DE LOS AGENTES: ${v.destino||"__________"}\n\nLUGAR\n${v.lugar||"__________"}\n\nPERSONA REQUERIDA\n${v.persona||"__________"} · ${v.documento||"__________"}\n\nTESTIGOS\n${v.testigos||"No constan."}\n\nCONTENIDO DEL ACTA\n${v.contenido||"________________________________________________________________"}`;
  const lines=t.fields.map(([name,label])=>`${label.toUpperCase()}: ${v[name]||"__________"}`).join("\n\n");
  return common+lines;
}

function scImprove(){
  let text=$("#scOutput").value||scBuildText();
  text=text.replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").replace(/ \n/g,"\n").trim();
  $("#scOutput").value=text;
  toast("Texto ordenado. Revisa siempre el contenido policial.");
}

async function scCopy(){
  if(!$("#scOutput").value.trim())$("#scOutput").value=scBuildText();
  try{await navigator.clipboard.writeText($("#scOutput").value);toast("Texto copiado para NIPal")}
  catch{ $("#scOutput").select();document.execCommand("copy");toast("Texto copiado") }
}

function scSave(){
  const values=scValues();
  localStorage.setItem("tcp-sc-last",JSON.stringify({template:scCurrentTemplate.id,values,output:$("#scOutput").value,savedAt:new Date().toISOString()}));
  localStorage.setItem(`tcp-sc-output-${scCurrentTemplate.id}`,$("#scOutput").value);
  toast("Acta guardada en este dispositivo");
}

function scRenderCases(){
  const box=$("#scCaseGrid");if(!box)return;
  const q=normalize($("#scCaseSearch")?.value||"");
  const sev=$("#scSeverityFilter")?.value||"all";box.innerHTML="";
  SC_CASES.filter(c=>(sev==="all"||c.severity===sev)&&(!q||normalize(`${c.article} ${c.title} ${c.text}`).includes(q))).forEach(c=>{
    const a=document.createElement("article");a.className="sc-case-card";
    a.innerHTML=`<header><span>${c.article}</span><span>${c.severity.toUpperCase()}</span></header><h3>${c.title}</h3><p>${c.text}</p><footer><button data-open>ABRIR MODELO</button><button data-copy>COPIAR GUÍA</button></footer>`;
    a.querySelector("[data-open]").onclick=()=>scSelectTemplate(c.template);
    a.querySelector("[data-copy]").onclick=async()=>{await navigator.clipboard.writeText(`${c.article} · ${c.title}\n${c.text}`);toast("Guía copiada")};
    box.appendChild(a);
  });
}

function scRenderArticles(){
  const box=$("#scArticleCards");if(!box)return;
  box.innerHTML="";
  SC_CASES.filter((c,i,a)=>a.findIndex(x=>x.article===c.article)===i).forEach(c=>{
    const b=document.createElement("button");b.className="sc-article-card";b.innerHTML=`<b>${c.article}</b><small>${c.title}</small>`;b.onclick=()=>{scShowView("library");$("#scCaseSearch").value=c.article;scRenderCases()};box.appendChild(b);
  });
}

function scReview(){
  const text=$("#scOutput").value.trim(),values=scValues(),items=[];
  items.push([!!text,"Texto generado","Genera o escribe el contenido del acta."]);
  const missing=Object.entries(values).filter(([k,v])=>!v).length;
  items.push([missing===0,"Campos del formulario",missing?`${missing} campos están vacíos. Comprueba si son necesarios.`:"Todos los campos están completados."]);
  items.push([!/_{3,}|\{\{/.test(text),"Variables pendientes","Existen guiones o variables pendientes de completar."]);
  items.push([text.length>180,"Detalle suficiente","El relato es demasiado breve para una revisión completa."]);
  if(scCurrentTemplate.id==="d10b")items.push([!/arma/i.test(values.objeto||""),"Uso de D10b","No utilices D10b para intervenir armas."]);
  $("#scReviewResults").innerHTML=items.map(([ok,title,desc])=>`<div class="sc-review-item ${ok?"ok":"warn"}"><b>${ok?"✓":"!"}</b><div><strong>${title}</strong><p>${ok?"Correcto":desc}</p></div></div>`).join("");
}


const SC_WEAPONS=[
 {article:"4.1.a",page:5,category:"fuego",title:"Armas de fuego fabricadas o modificadas ilícitamente",keywords:"sin numero serie fogueo artesanal transformada"},
 {article:"4.1.b",page:6,category:"fuego",title:"Armas largas con dispositivos para alojar armas",keywords:"culata pistola arma oculta"},
 {article:"4.1.c",page:7,category:"fuego",title:"Pistolas y revólveres con culatín adaptado",keywords:"culatin revolver pistola"},
 {article:"4.1.d",page:8,category:"oculta",title:"Armas de fuego para alojar o alojadas en otros objetos",keywords:"objeto oculto alojamiento"},
 {article:"4.1.e",page:9,category:"oculta",title:"Armas de fuego simuladas bajo apariencia de otro objeto",keywords:"boligrafo telefono baston apariencia"},
 {article:"4.1.f",page:10,category:"blanca",title:"Bastones-estoque",keywords:"baston estoque hoja oculta"},
 {article:"4.1.f",page:11,category:"blanca",title:"Puñales",keywords:"puñal doble filo hoja"},
 {article:"4.1.f",page:12,category:"blanca",title:"Navajas automáticas",keywords:"automatica resorte pulsador"},
 {article:"4.1.f",page:13,category:"blanca",title:"Navajas automáticas de apertura asistida",keywords:"asistida muelle apertura"},
 {article:"4.1.f",page:14,category:"blanca",title:"Navajas automáticas de inercia o gravedad",keywords:"inercia gravedad apertura"},
 {article:"4.1.h",page:15,category:"blanca",title:"Navaja automática mariposa",keywords:"mariposa balisong"},
 {article:"4.1.g",page:16,category:"fuego",title:"Armas combinadas: fuego y arma blanca",keywords:"combinada hibrida pistola cuchillo"},
 {article:"4.1.h",page:17,category:"impacto",title:"Defensas de alambre o plomo",keywords:"defensa alambre plomo flexible"},
 {article:"4.1.h",page:18,category:"impacto",title:"Rompecabezas",keywords:"rompecabezas maza impacto"},
 {article:"4.1.h",page:19,category:"impacto",title:"Llaves de pugilato o puño americano",keywords:"puño americano brass knuckles pugilato"},
 {article:"4.1.h",page:20,category:"impacto",title:"Tiragomas perfeccionados",keywords:"tirachinas tiragomas"},
 {article:"4.1.h",page:21,category:"oculta",title:"Cerbatanas perfeccionadas",keywords:"cerbatana dardo"},
 {article:"4.1.h",page:22,category:"impacto",title:"Munchacos",keywords:"nunchaku munchaco"},
 {article:"4.1.h",page:23,category:"impacto",title:"Xirinquete",keywords:"xirinquete impacto"},
 {article:"4.1.h",page:25,category:"oculta",title:"Tarjeta navaja",keywords:"tarjeta cuchillo cartera"},
 {article:"4.1.h",page:26,category:"blanca",title:"Urban Skinner",keywords:"urban skinner cuchilla"},
 {article:"4.1.h",page:27,category:"oculta",title:"Hebilla de cinturón con hoja",keywords:"hebilla cinturon hoja oculta"},
 {article:"4.1.h",page:28,category:"oculta",title:"Llavero con hoja oculta",keywords:"llavero cuchillo oculto"},
 {article:"4.1.h",page:29,category:"oculta",title:"Bolígrafo navaja",keywords:"boligrafo cuchillo"},
 {article:"4.1.h",page:30,category:"blanca",title:"Cuchillos lanzadores",keywords:"lanzador cuchillo throwing"},
 {article:"4.1.h",page:31,category:"blanca",title:"Armas blancas tipo karambit",keywords:"karambit curva anillo"},
 {article:"4.1.h",page:32,category:"impacto",title:"Bolso con llave de pugilato como asa",keywords:"bolso puño americano asa"}
];
let scWeaponSelected=SC_WEAPONS[0];

function scFilteredWeapons(){
  const q=normalize($("#scWeaponsSearch")?.value||"");
  const active=document.querySelector("[data-weapons-filter].active")?.dataset.weaponsFilter||"all";
  return SC_WEAPONS.filter(w=>(active==="all"||w.category===active)&&(!q||normalize(`${w.article} ${w.title} ${w.keywords}`).includes(q)));
}
function scRenderWeapons(){
  const box=$("#scWeaponsList");if(!box)return;
  box.innerHTML="";
  scFilteredWeapons().forEach(w=>{
    const b=document.createElement("button");
    b.className="sc-weapon-item"+(scWeaponSelected===w?" active":"");
    b.innerHTML=`<b>${w.article}</b><span><strong>${w.title}</strong><small>Página ${w.page} del PDF</small></span><em>VER</em>`;
    b.onclick=()=>scSelectWeapon(w);
    box.appendChild(b);
  });
}
function scSelectWeapon(w){
  scWeaponSelected=w;
  $("#scWeaponArticle").textContent=`ART. ${w.article})`;
  $("#scWeaponTitle").textContent=w.title;
  $("#scWeaponsFrame").src=`catalogo-armas-prohibidas.pdf#page=${w.page}&view=FitH`;
  scRenderWeapons();
}
function scOpenWeaponExternal(page=scWeaponSelected.page){
  window.open(`catalogo-armas-prohibidas.pdf#page=${page}&view=FitH`,"_blank");
}
function setupWeaponsCatalogue(){
  scRenderWeapons();
  $("#scWeaponsSearch").oninput=scRenderWeapons;
  document.querySelectorAll("[data-weapons-filter]").forEach(b=>b.onclick=()=>{
    document.querySelectorAll("[data-weapons-filter]").forEach(x=>x.classList.toggle("active",x===b));
    scRenderWeapons();
  });
  $("#scOpenWeaponsPdf").onclick=()=>window.open("catalogo-armas-prohibidas.pdf","_blank");
  $("#scWeaponsFullscreen").onclick=()=>scOpenWeaponExternal();
  $("#scOpenWeaponPageMobile").onclick=()=>scOpenWeaponExternal();
  $("#scCopyWeaponRule").onclick=async()=>{
    const text=`R.D. 137/1993, art. ${scWeaponSelected.article}) — ${scWeaponSelected.title}. Consulta del catálogo de armas prohibidas; revisar actuación administrativa o penal aplicable.`;
    try{await navigator.clipboard.writeText(text);toast("Normativa copiada")}
    catch{toast("No se pudo copiar automáticamente")}
  };
}

function setupSeguridadCiudadana(){
  document.querySelectorAll("[data-sc-open]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();document.getElementById("sideDrawer")?.classList.remove("open");document.getElementById("drawerBackdrop")?.classList.remove("open");scOpen()}));
  document.querySelectorAll("[data-sc-view]").forEach(b=>b.onclick=()=>scShowView(b.dataset.scView));
  document.querySelectorAll("[data-sc-template]").forEach(b=>b.onclick=()=>scSelectTemplate(b.dataset.scTemplate));
  $("#scBackButton").onclick=scClose;$("#scMenuButton").onclick=()=>$("#scWorkspace").classList.toggle("sc-menu-open");
  $("#scHelpButton").onclick=()=>alert("SEGURIDAD CIUDADANA 4/2015\n\nSelecciona un modelo, completa los campos, genera el texto y utiliza «Copiar para NIPal». Todos los contenidos son orientativos y deben revisarse.");
  $("#scSaveButton").onclick=scSave;$("#scNewFormButton").onclick=()=>scSelectTemplate("d10");
  $("#scTemplateSearch").oninput=scRenderTemplates;$("#scCategoryFilter").onchange=scRenderTemplates;
  $("#scCaseSearch").oninput=scRenderCases;$("#scSeverityFilter").onchange=scRenderCases;
  $("#scGenerateButton").onclick=()=>$("#scOutput").value=scBuildText();$("#scCopyButton").onclick=scCopy;$("#scImproveButton").onclick=scImprove;
  $("#scClearButton").onclick=()=>{if(confirm("¿Borrar el texto actual?"))$("#scOutput").value=""};
  $("#scPrintButton").onclick=()=>{if(!$("#scOutput").value.trim())$("#scOutput").value=scBuildText();const w=window.open("","_blank");if(!w)return toast("Ventana bloqueada");w.document.write(`<html><head><meta charset="utf-8"><title>${scCurrentTemplate.code}</title><style>body{font-family:Arial;padding:35px;white-space:pre-wrap;line-height:1.5}</style></head><body>${$("#scOutput").value.replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m]))}</body></html>`);w.document.close();w.print()};
  $("#scRunReview").onclick=scReview;
  $("#scGlobalSearch").oninput=e=>{scShowView("library");$("#scCaseSearch").value=e.target.value;scRenderCases()};
  document.addEventListener("keydown",e=>{if(!$("#scWorkspace").hidden&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#scGlobalSearch").focus()}});
}


const PA_TEMPLATES=[
 {id:"a10-general",code:"A10",category:"general",type:"Acta administrativa abierta",title:"Acta administrativa de constatación de hechos",help:["Identificar municipio, fecha, hora, instructor, secretario y destino.","Describir el lugar, actividad y persona requerida.","Diferenciar hechos observados y manifestaciones.","Indicar documentación solicitada y presentada.","Cerrar con medidas adoptadas, destino y hora de finalización."],fields:[
  ["diligencias","Número de diligencias","text"],["municipio","Municipio y comarca","text"],["fecha","Fecha","date"],["hora_inicio","Hora de inicio","time"],["instructor","Instructor/a","text"],["secretario","Secretario/a","text"],["destino","Destino de los agentes","text"],["lugar","Dirección y tipo de establecimiento","text"],["actividad","Actividad y nombre comercial","text"],["responsable","Responsable o titular","text"],["documento","Documento identificativo","text"],["testigos","Testigos","textarea","full"],["documentacion","Documentación solicitada y resultado","textarea","full"],["hechos","Hechos observados","textarea","full"],["manifestaciones","Manifestaciones de terceros","textarea","full"],["medidas","Medidas adoptadas o cautelares","textarea","full"],["destinatario","Organismo destinatario","text"],["hora_fin","Hora de finalización","time"]
 ]},
 {id:"bar-musical",code:"A10",category:"espectaculos",type:"Inspección de actividad musical",title:"Acta de inspección de bar musical",help:["Comprobar licencia o título habilitante y actividad autorizada.","Revisar seguro de responsabilidad civil y recibo en vigor.","Comprobar aforo, horarios, rótulos, salidas, iluminación y seguridad.","Distinguir bar musical de discoteca: el bar musical no dispone de pista de baile o espacio asimilable.","Recoger hechos concretos, incidencias y medidas adoptadas."],fields:[
  ["diligencias","Número de diligencias","text"],["municipio","Municipio / comarca","text"],["fecha","Fecha","date"],["hora_inicio","Hora de inicio","time"],["agentes","Agentes / TIP","text"],["establecimiento","Nombre y dirección del local","text"],["responsable","Responsable presente","text"],["documento","Documento identificativo","text"],["licencia","Licencia, comunicación o autorización","textarea","full"],["seguro","Seguro RC, cobertura y vigencia","textarea","full"],["actividad_observada","Actividad efectivamente observada","textarea","full"],["seguridad","Seguridad, salidas, techo, elementos y riesgos","textarea","full"],["aforo","Aforo y estimación de asistentes","text"],["horario","Horario comprobado","text"],["personal","Personal de control o seguridad","textarea","full"],["incidencias","Incidencias y hechos observados","textarea","full"],["medidas","Medidas adoptadas","textarea","full"],["hora_fin","Hora de finalización","time"]
 ]},
 {id:"actividad-distinta",code:"A10",category:"espectaculos",type:"Actividad no autorizada",title:"Actividad distinta de la autorizada",help:["Identificar la actividad autorizada y la observada.","Describir elementos diferenciales: pista de baile, DJ, tarima, equipos, iluminación, humo, público bailando, etc.","Relacionar licencia, seguro, aforo, horario y responsable.","Evitar afirmar una calificación jurídica sin describir antes los hechos objetivos."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["agentes","Agentes / TIP","text"],["local","Local, dirección y municipio","text"],["responsable","Titular o responsable","text"],["autorizada","Actividad autorizada","text"],["observada","Actividad observada","text"],["elementos","Elementos objetivos observados","textarea","full"],["documentacion","Documentación aportada o no aportada","textarea","full"],["publico","Número aproximado y comportamiento del público","textarea","full"],["requerimientos","Requerimientos efectuados","textarea","full"],["medidas","Medidas adoptadas y organismo destinatario","textarea","full"]
 ]},
 {id:"a46-horario",code:"A46",category:"espectaculos",type:"Infracción horaria",title:"Acta por incumplimiento de horario",help:["Consignar horario legal o autorizado y hora real comprobada.","Identificar actividad, titular y responsable presente.","Describir si permanecía abierta, con clientes, música, servicio o acceso.","Indicar reiteración de comprobaciones y hora de finalización."],fields:[
  ["fecha","Fecha","date"],["hora_comprobacion","Hora de comprobación","time"],["local","Establecimiento y dirección","text"],["actividad","Actividad","text"],["responsable","Responsable presente","text"],["horario_autorizado","Horario autorizado o aplicable","text"],["hechos","Hechos observados tras el horario","textarea","full"],["clientes","Personas presentes / accesos","text"],["musica","Música, servicio o actividad en funcionamiento","textarea","full"],["requerimiento","Requerimientos realizados","textarea","full"],["hora_fin","Hora de finalización","time"]
 ]},
 {id:"a47-espectaculos",code:"A47",category:"espectaculos",type:"Inspección específica",title:"Inspección de espectáculos públicos y actividades recreativas",help:["Modelo reservado según instrucciones del cuerpo o unidad especializada.","Comprobar documentación, rótulos, seguridad, asistencia sanitaria, higiene, horarios, menores, admisión y hojas de reclamación.","Describir cada apartado comprobado y la evidencia disponible."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["establecimiento","Establecimiento / actividad","text"],["direccion","Dirección","text"],["titular","Titular / responsable","text"],["licencia","Licencia / autorización / comunicación","textarea","full"],["seguro","Seguro RC y cobertura","textarea","full"],["aforo","Aforo autorizado y estimado","text"],["rotulos","Rótulos y placas normalizadas","textarea","full"],["seguridad","Condiciones de seguridad y evacuación","textarea","full"],["sanidad","Asistencia sanitaria, higiene y salubridad","textarea","full"],["menores","Presencia y control de menores","textarea","full"],["admision","Derecho de admisión y control de acceso","textarea","full"],["horario","Horario","text"],["hechos","Deficiencias o hechos observados","textarea","full"],["medidas","Medidas adoptadas","textarea","full"]
 ]},
 {id:"a03-seguridad",code:"A03",category:"seguridad",type:"Inspección de seguridad privada",title:"Inspección de servicio y personal de seguridad privada",help:["Comprobar empresa, servicio y autorización aplicable.","Identificar personal y TIP/habilitación.","Revisar uniforme, distintivo, funciones, medios y lugar de prestación.","Diferenciar vigilante de seguridad y personal de control de acceso.","Describir efectos o instrumentos portados y cualquier actuación observada."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["lugar","Lugar y establecimiento","text"],["empresa","Empresa de seguridad","text"],["servicio","Servicio contratado","text"],["vigilante","Vigilante / personal inspeccionado","text"],["documento","Documento identificativo","text"],["tip","TIP o acreditación profesional","text"],["uniforme","Uniforme, distintivos y placa","textarea","full"],["medios","Defensa, grilletes, equipo y otros medios","textarea","full"],["funciones","Funciones que realizaba","textarea","full"],["comprobaciones","Comprobaciones y documentación","textarea","full"],["hechos","Incidencias observadas","textarea","full"],["medidas","Medidas o denuncias efectuadas","textarea","full"]
 ]},
 {id:"control-acceso",code:"A10",category:"espectaculos",type:"Control de acceso",title:"Acta de inspección de personal de control de acceso",help:["Comprobar distintivo visible, habilitación y funciones.","Registrar motivo de denegación de acceso y versión de las personas.","Diferenciar controlador de acceso y vigilante de seguridad.","Describir intervención de objetos o actuaciones fuera de sus funciones."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["local","Local y dirección","text"],["responsable","Titular o responsable","text"],["controlador","Controlador de acceso","text"],["acreditacion","Carnet, número y distintivo","textarea","full"],["requirente","Persona requirente","text"],["motivo","Motivo de denegación o incidente","textarea","full"],["observado","Hechos observados por los agentes","textarea","full"],["manifestaciones","Manifestaciones recogidas","textarea","full"],["medidas","Medidas o denuncias","textarea","full"]
 ]},
 {id:"seguro-rc",code:"A10",category:"espectaculos",type:"Obligación documental",title:"Falta o deficiencia del seguro de responsabilidad civil",help:["Indicar si se aporta póliza, recibo o declaración responsable.","Consignar cobertura exacta contratada y aforo autorizado.","No limitarse a decir «no aporta»: describir requerimiento y respuesta."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["establecimiento","Establecimiento","text"],["titular","Titular / responsable","text"],["aforo","Aforo autorizado","text"],["requerimiento","Documentación requerida","textarea","full"],["aportada","Documentación aportada","textarea","full"],["cobertura","Cobertura exacta comprobada","text"],["hechos","Deficiencias observadas","textarea","full"],["medidas","Medidas adoptadas","textarea","full"]
 ]},
 {id:"menores",code:"A10",category:"espectaculos",type:"Menores de edad",title:"Presencia de menores en establecimiento con acceso restringido",help:["Identificar menor, edad y responsables legales cuando proceda.","Identificar establecimiento y prohibición de acceso aplicable.","Requerir al responsable que haga cesar la situación.","Indicar rótulo de prohibición, reiteración y medidas adoptadas."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["establecimiento","Establecimiento","text"],["actividad","Actividad","text"],["menor","Menor y edad","text"],["responsable_legal","Responsable legal y contacto","text"],["responsable_local","Responsable del local","text"],["rotulo","Rótulo o advertencia visible","textarea","full"],["hechos","Hechos observados","textarea","full"],["requerimiento","Requerimiento al responsable","textarea","full"],["resultado","Resultado y comunicaciones","textarea","full"]
 ]},
 {id:"derecho-admision",code:"A10",category:"espectaculos",type:"Derecho de admisión",title:"Actuación relacionada con el derecho de admisión",help:["Recoger condiciones de admisión publicitadas y autorizadas.","Identificar motivo concreto de denegación.","Comprobar ausencia de discriminación y actuación del personal de acceso.","Relacionar hojas de reclamación y personas implicadas."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["local","Local","text"],["persona","Persona afectada","text"],["controlador","Personal de acceso","text"],["condiciones","Condiciones de admisión publicitadas","textarea","full"],["motivo","Motivo manifestado de denegación","textarea","full"],["observado","Hechos observados","textarea","full"],["reclamacion","Hoja de reclamación y resultado","textarea","full"],["medidas","Medidas adoptadas","textarea","full"]
 ]},
 {id:"fiesta-no-autorizada",code:"A10",category:"espectaculos",type:"Actividad extraordinaria",title:"Fiesta o actividad recreativa no autorizada",help:["Determinar carácter público o acceso restringido.","Identificar organizador, titular del espacio y forma de acceso.","Comprobar cobro, publicidad, venta de productos, música, asistentes y seguridad.","Motivar medidas provisionales, comiso o precinto cuando proceda."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["lugar","Lugar","text"],["organizador","Organizador / responsable","text"],["acceso","Forma de acceso","text"],["publicidad","Publicidad y convocatoria","textarea","full"],["cobro","Cobro de entrada / venta","textarea","full"],["actividad","Actividad observada","textarea","full"],["asistentes","Número aproximado de asistentes","text"],["seguridad","Riesgos y condiciones de seguridad","textarea","full"],["autorizacion","Autorización o licencia","textarea","full"],["medidas","Medidas provisionales adoptadas y motivación","textarea","full"]
 ]},
 {id:"juego",code:"A10",category:"juego",type:"Inspección de juego",title:"Inspección de actividad de juego o máquinas recreativas",help:["Identificar establecimiento, responsable y autorización.","Comprobar máquinas, documentación, distintivos y acceso de personas prohibidas.","Describir apuestas, importes, organización y posible juego ilegal."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["establecimiento","Establecimiento y dirección","text"],["responsable","Responsable","text"],["autorizacion","Autorización / documentación","textarea","full"],["maquinas","Máquinas recreativas y documentación","textarea","full"],["acceso","Control de acceso y personas presentes","textarea","full"],["juego","Actividad de juego observada","textarea","full"],["apuestas","Apuestas, importes y organización","textarea","full"],["hechos","Incidencias observadas","textarea","full"],["medidas","Medidas adoptadas","textarea","full"]
 ]},
 {id:"hostalaje",code:"A10",category:"relevantes",type:"Actividad relevante",title:"Inspección de establecimiento de hospedaje",help:["Comprobar registro y comunicación de personas alojadas conforme al procedimiento aplicable.","Identificar titular, sistema utilizado y período revisado.","Relacionar omisiones, demoras o datos incompletos."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["establecimiento","Establecimiento de hospedaje","text"],["titular","Titular / responsable","text"],["registro","Sistema o libro de registro","textarea","full"],["periodo","Período comprobado","text"],["comunicaciones","Comunicaciones efectuadas","textarea","full"],["incidencias","Omisiones o incidencias","textarea","full"],["documentacion","Documentación examinada","textarea","full"],["medidas","Requerimientos y medidas","textarea","full"]
 ]},
 {id:"objetos-usados",code:"A10",category:"relevantes",type:"Actividad relevante",title:"Inspección de compraventa de objetos usados",help:["Identificar establecimiento y actividad.","Comprobar libro o registro, identidad de transmitentes y objetos.","Relacionar números de serie, procedencia y comunicaciones requeridas."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["establecimiento","Establecimiento","text"],["responsable","Responsable","text"],["registro","Libro o sistema de registro","textarea","full"],["objetos","Objetos comprobados","textarea","full"],["transmitentes","Identificación de transmitentes","textarea","full"],["series","Números de serie y trazabilidad","textarea","full"],["incidencias","Incidencias","textarea","full"],["medidas","Requerimientos","textarea","full"]
 ]},
 {id:"joyas-metales",code:"A10",category:"relevantes",type:"Actividad relevante",title:"Inspección de compraventa de joyas y metales",help:["Comprobar registro documental de operaciones.","Identificar piezas, peso, procedencia, transmitentes y comunicaciones.","Revisar medidas de seguridad sectoriales cuando proceda."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["establecimiento","Establecimiento","text"],["responsable","Responsable","text"],["registro","Registro de operaciones","textarea","full"],["piezas","Piezas o metales comprobados","textarea","full"],["transmitentes","Transmitentes","textarea","full"],["comunicaciones","Comunicaciones policiales","textarea","full"],["seguridad","Medidas de seguridad","textarea","full"],["incidencias","Incidencias y medidas","textarea","full"]
 ]},
 {id:"venta-ambulante",code:"A10",category:"comercio",type:"Comercio",title:"Inspección de venta ambulante o no sedentaria",help:["Identificar vendedor, titular de la autorización y ubicación.","Comprobar productos, permisos, horarios y condiciones municipales.","Diferenciar ocupación de vía pública, comercio y posible ilícito penal."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["lugar","Lugar y puesto","text"],["persona","Persona responsable","text"],["documento","Documento","text"],["autorizacion","Autorización municipal","textarea","full"],["productos","Productos expuestos o vendidos","textarea","full"],["procedencia","Procedencia y documentación","textarea","full"],["hechos","Hechos observados","textarea","full"],["medidas","Medidas o intervención","textarea","full"]
 ]},
 {id:"medidas-cautelares",code:"A10",category:"general",type:"Medidas cautelares",title:"Acta de adopción de medida cautelar o provisional",help:["Motivar finalidad, necesidad, proporcionalidad y hechos concretos.","Identificar bienes, actividad o zona afectada.","Indicar órgano competente, comunicación y plazo cuando proceda.","No presentar la medida como resolución definitiva del expediente."],fields:[
  ["fecha","Fecha","date"],["hora","Hora","time"],["lugar","Lugar","text"],["actividad","Actividad","text"],["responsable","Responsable","text"],["hechos","Hechos que motivan la medida","textarea","full"],["riesgo","Riesgo o finalidad perseguida","textarea","full"],["medida","Medida adoptada","textarea","full"],["bienes","Bienes u objetos afectados","textarea","full"],["motivacion","Necesidad y proporcionalidad","textarea","full"],["comunicacion","Comunicación al órgano competente","textarea","full"],["resultado","Resultado final de la actuación","textarea","full"]
 ]}
];

const PA_CHECKLISTS=[
 {area:"espectaculos",title:"Documentación del establecimiento",items:["Licencia, autorización o comunicación previa","Actividad autorizada y titular","Seguro de responsabilidad civil y recibo en vigor","Cobertura contratada y aforo autorizado","Hojas oficiales de reclamación","Rótulos y placas obligatorias"]},
 {area:"espectaculos",title:"Seguridad y funcionamiento",items:["Salidas y vías de evacuación libres","Iluminación y señalización de emergencia","Elementos estructurales sin riesgos aparentes","Aforo y estimación de asistentes","Dispositivo de asistencia sanitaria","Higiene y salubridad"]},
 {area:"espectaculos",title:"Actividad musical",items:["Tipo de actividad autorizada","Pista de baile o espacio asimilable","DJ, música en directo o ambientación","Tarima, escenario y camerinos","Equipos de sonido e iluminación","Máquina de humo u otros elementos"]},
 {area:"espectaculos",title:"Personas y acceso",items:["Responsable presente","Personal de control de acceso","Distintivo y habilitación","Condiciones del derecho de admisión","Menores y limitaciones de acceso","Consumo de alcohol, tabaco o sustancias"]},
 {area:"seguridad",title:"Servicio de seguridad privada",items:["Empresa autorizada","Contrato o servicio prestado","Identidad y TIP del personal","Uniforme y distintivo profesional","Funciones realmente realizadas","Defensa, grilletes y medios portados","Libro registro o incidencias","Comunicación de irregularidades"]},
 {area:"juego",title:"Juego y máquinas",items:["Autorización del establecimiento","Documentación de máquinas","Distintivos y homologación","Control de personas con acceso prohibido","Actividad de juego observada","Apuestas e importes","Organizador y beneficiarios","Posible juego ilegal"]},
 {area:"relevantes",title:"Hospedaje",items:["Titular y responsable","Sistema de registro de viajeros","Identificación de huéspedes","Comunicación de datos","Período y registros comprobados","Omisiones o retrasos"]},
 {area:"relevantes",title:"Objetos usados, joyas y metales",items:["Libro o registro de operaciones","Identidad de transmitentes","Descripción de objetos o piezas","Número de serie, peso o trazabilidad","Procedencia","Comunicación policial","Medidas de seguridad"]},
 {area:"comercio",title:"Comercio y venta ambulante",items:["Autorización municipal","Titular y persona responsable","Ubicación y ocupación de vía pública","Productos y procedencia","Precios o información al consumidor","Horarios y condiciones","Medidas adoptadas"]}
];

const PA_LIBRARY=[
 {id:"inspeccion",title:"Inspección y acta administrativa",html:`<h2>Inspección y acta administrativa</h2><p>La inspección comprueba in situ el desarrollo de una actividad conforme a la normativa sectorial. Debe incluir comprobaciones generales —licencias, permisos, autorizaciones y certificados— y comprobaciones específicas de cada actividad.</p><h3>Estructura recomendada</h3><ol><li>Encabezamiento e identificación.</li><li>Situación temporal y espacial.</li><li>Documentación requerida y resultado.</li><li>Hechos observados objetivamente.</li><li>Manifestaciones diferenciadas.</li><li>Medidas adoptadas y motivación.</li><li>Cierre, hora final y firmas.</li></ol><h3>Principios</h3><ul><li>Máxima información objetiva.</li><li>Sin interpretaciones subjetivas.</li><li>Relato suficiente para que el órgano competente pueda valorar subsanación o sanción.</li></ul>`},
 {id:"espectaculos",title:"Espectáculos y actividades recreativas",html:`<h2>Espectáculos y actividades recreativas</h2><p>El control abarca documentación, rótulos, seguridad, asistencia sanitaria, higiene, medidas provisionales, horarios, menores, derecho de admisión, hojas de reclamación y obligaciones frente al consumo de sustancias.</p><h3>Tipologías musicales</h3><ul><li><b>Bar musical:</b> servicio de bar y ambientación musical, sin pista de baile o espacio asimilable.</li><li><b>Discoteca:</b> local destinado a bailar, con pista de baile y servicio de bar.</li><li><b>Sala de baile:</b> música en directo, escenario, pista, vestidor y bar.</li><li><b>Sala de concierto:</b> actuaciones de música en directo y otras actividades culturales.</li></ul><h3>Actividad distinta</h3><p>Cuando la actividad observada no coincide con la autorizada, el acta debe describir los elementos objetivos que permiten distinguirlas.</p>`},
 {id:"seguridad",title:"Seguridad privada",html:`<h2>Seguridad privada</h2><p>La actuación debe identificar empresa, servicio, personal, habilitación, uniforme, distintivo, funciones y medios portados.</p><h3>Pautas</h3><ul><li>Comprobar TIP o acreditación.</li><li>Diferenciar vigilante de seguridad y controlador de acceso.</li><li>Describir si el personal ejerce funciones que no le corresponden.</li><li>Relacionar defensa, grilletes u otros medios.</li><li>Documentar identificación de personas, efectos y comunicaciones.</li></ul>`},
 {id:"juego",title:"Juego",html:`<h2>Juego</h2><p>La inspección puede comprender personas con acceso prohibido, máquinas recreativas y posibles supuestos de juego ilegal.</p><ul><li>Autorizaciones y documentación.</li><li>Características y distintivos de máquinas.</li><li>Acceso de menores o personas prohibidas.</li><li>Apuestas, importes, organización y beneficiarios.</li><li>Medidas e intervención de efectos cuando corresponda.</li></ul>`},
 {id:"relevantes",title:"Actividades relevantes para la seguridad ciudadana",html:`<h2>Actividades relevantes</h2><p>Incluyen, entre otras, hospedaje, comercio y reparación de objetos usados, compraventa de joyas, alquiler de vehículos y gestión de determinados residuos.</p><h3>Objetivo operativo</h3><p>Comprobar las obligaciones de registro y comunicación, la identidad de las personas intervinientes y la trazabilidad de operaciones u objetos.</p>`},
 {id:"comercio",title:"Comercio y consumo",html:`<h2>Comercio y consumo</h2><p>El control administrativo puede afectar a establecimientos comerciales, venta ambulante o no sedentaria, horarios, autorizaciones, información al consumidor y ocupación del espacio público.</p><h3>Acta</h3><p>Debe recoger autorización, titular, ubicación, productos, procedencia, condiciones de venta y medidas adoptadas.</p>`},
 {id:"medidas",title:"Medidas cautelares y provisionales",html:`<h2>Medidas cautelares</h2><p>Su finalidad puede ser asegurar la eficacia de la resolución, evitar la desaparición de objetos, impedir la reiteración o evitar un peligro manifiesto para las personas.</p><ul><li>Deben motivarse.</li><li>Deben ser necesarias y proporcionadas.</li><li>No constituyen la resolución definitiva.</li><li>Debe documentarse la comunicación al órgano competente cuando proceda.</li></ul>`}
];

let paCurrent=PA_TEMPLATES[0];
let paMaterialUrl="policia-administrativa-uf6-2-2024.pdf";

function paOpen(){
  $("#paWorkspace").hidden=false;
  document.body.style.overflow="hidden";
  document.querySelector(".topbar")?.setAttribute("hidden","");
  document.querySelector(".desktop-police-rail")?.setAttribute("hidden","");
  document.querySelector(".bottomnav")?.setAttribute("hidden","");
  paShow("dashboard");
  paRenderTemplates();paRenderChecklists();paRenderLibrary();
  paSelectTemplate(paCurrent.id,false);
}
function paClose(){
  $("#paWorkspace").hidden=true;document.body.style.overflow="";
  document.querySelector(".topbar")?.removeAttribute("hidden");
  document.querySelector(".desktop-police-rail")?.removeAttribute("hidden");
  document.querySelector(".bottomnav")?.removeAttribute("hidden");
}
function paShow(name){
  document.querySelectorAll("#paWorkspace .pa-view").forEach(v=>v.hidden=true);
  const map={dashboard:"#paDashboard",forms:"#paFormsView",checklists:"#paChecklistsView",library:"#paLibraryView",materials:"#paMaterialsView",review:"#paReviewView"};
  $(map[name]||map.dashboard).hidden=false;
  document.querySelectorAll("[data-pa-view]").forEach(b=>b.classList.toggle("active",b.dataset.paView===name));
  $("#paWorkspace").classList.remove("pa-menu-open");
}
function paTemplate(id){return PA_TEMPLATES.find(t=>t.id===id)}
function paRenderTemplates(){
  const box=$("#paTemplateList");if(!box)return;
  const q=normalize($("#paTemplateSearch")?.value||"");
  const cat=$("#paTemplateCategory")?.value||"all";box.innerHTML="";
  PA_TEMPLATES.filter(t=>(cat==="all"||t.category===cat)&&(!q||normalize(`${t.code} ${t.title} ${t.type}`).includes(q))).forEach(t=>{
    const b=document.createElement("button");b.className="pa-template-item"+(paCurrent.id===t.id?" active":"");
    b.innerHTML=`<b>${t.code}</b><span><strong>${t.title}</strong><small>${t.type}</small></span><em>ABRIR</em>`;
    b.onclick=()=>paSelectTemplate(t.id);box.appendChild(b)
  });
}
function paSelectTemplate(id,show=true){
  const t=paTemplate(id);if(!t)return;paCurrent=t;if(show)paShow("forms");
  $("#paCurrentCode").textContent=t.code;$("#paCurrentType").textContent=t.type.toUpperCase();$("#paCurrentTitle").textContent=t.title;
  $("#paHelpTitle").textContent=`${t.code} · ${t.title}`;
  $("#paHelpContent").innerHTML=`<div class="pa-model-note">Plantilla de apoyo construida con el material aportado. No sustituye el formulario oficial vigente.</div><ul>${t.help.map(x=>`<li>${x}</li>`).join("")}</ul>`;
  const form=$("#paFormFields");form.innerHTML="";
  t.fields.forEach(([name,label,type,cls])=>{
    const w=document.createElement("label");if(cls)w.className=cls;w.textContent=label;
    const e=type==="textarea"?document.createElement("textarea"):document.createElement("input");
    if(type==="textarea")e.rows=4;else e.type=type;e.name=name;e.dataset.label=label;w.appendChild(e);form.appendChild(w);
  });
  $("#paOutput").value=localStorage.getItem(`tcp-pa-output-${id}`)||"";
  paRenderTemplates();
}
function paValues(){const v={};document.querySelectorAll("#paFormFields [name]").forEach(e=>v[e.name]=e.value.trim());return v}
function paDate(v){return v?v.split("-").reverse().join("/"):"__________"}
function paBuild(){
  const t=paCurrent,v=paValues();
  const values=t.fields.map(([name,label,type])=>{
    let value=v[name]||"__________";
    if(type==="date")value=paDate(value);
    return `${label.toUpperCase()}: ${value}`;
  }).join("\n\n");
  return `${t.code} · ${t.title.toUpperCase()}\n\n${values}\n\nCIERRE\nSe hace constar que el contenido anterior refleja las comprobaciones y circunstancias documentadas por los agentes actuantes, sin perjuicio de su revisión, ampliación y remisión al órgano administrativo competente.`;
}
function paImprove(){
  let text=$("#paOutput").value||paBuild();
  text=text.replace(/[ \t]+/g," ").replace(/\n{3,}/g,"\n\n").replace(/ \n/g,"\n").trim();
  $("#paOutput").value=text;toast("Redacción ordenada. Revisa los hechos y la normativa.");
}
async function paCopy(){
  if(!$("#paOutput").value.trim())$("#paOutput").value=paBuild();
  try{await navigator.clipboard.writeText($("#paOutput").value);toast("Acta copiada para NIPal")}
  catch{$("#paOutput").select();document.execCommand("copy");toast("Acta copiada")}
}
function paSave(){
  localStorage.setItem(`tcp-pa-output-${paCurrent.id}`,$("#paOutput").value);
  localStorage.setItem("tcp-pa-last",JSON.stringify({template:paCurrent.id,values:paValues(),savedAt:new Date().toISOString()}));
  toast("Acta guardada en este dispositivo");
}
function paRenderChecklists(){
  const box=$("#paChecklistGrid");if(!box)return;
  const q=normalize($("#paChecklistSearch")?.value||"");
  const area=$("#paChecklistArea")?.value||"all";box.innerHTML="";
  PA_CHECKLISTS.filter(c=>(area==="all"||c.area===area)&&(!q||normalize(`${c.title} ${c.items.join(" ")}`).includes(q))).forEach(c=>{
    const a=document.createElement("article");a.className="pa-check-card";
    a.innerHTML=`<header><h3>${c.title}</h3><small>${c.area.toUpperCase()}</small></header>${c.items.map(i=>`<label><input type="checkbox"><span>${i}</span></label>`).join("")}`;
    box.appendChild(a)
  });
}
function paRenderLibrary(selected="inspeccion"){
  const index=$("#paLibraryIndex"),article=$("#paLibraryArticle");if(!index||!article)return;
  index.innerHTML="";
  PA_LIBRARY.forEach(item=>{
    const b=document.createElement("button");b.textContent=item.title;b.classList.toggle("active",item.id===selected);b.onclick=()=>paRenderLibrary(item.id);index.appendChild(b)
  });
  article.innerHTML=(PA_LIBRARY.find(x=>x.id===selected)||PA_LIBRARY[0]).html;
}
function paOpenArea(area){
  paShow("library");
  paRenderLibrary(area==="inspeccion"?"inspeccion":area);
}
function paOpenMaterial(kind){
  const materials={
    uf62:["UF 6.2 · Ámbitos de actuación en policía administrativa","policia-administrativa-uf6-2-2024.pdf"],
    bar:["Ejemplo · Acta de inspección de bar musical","exemple-acta-inspeccio-bar-musical.pdf"],
    segpriv:["Ejemplo · Acta A10 de seguridad privada","exemple-acta-seguretat-privada-a10.pdf"]
  };
  const [title,url]=materials[kind]||materials.uf62;paMaterialUrl=url;
  $("#paMaterialTitle").textContent=title;$("#paMaterialFrame").src=`${url}#view=FitH`;paShow("materials");
}
function paReview(){
  const text=$("#paOutput").value.trim(),v=paValues(),items=[];
  const missing=Object.entries(v).filter(([k,val])=>!val).length;
  items.push([!!text,"Texto generado","Genera o redacta el contenido."]);
  items.push([missing===0,"Campos","Hay "+missing+" campos vacíos; revisa cuáles son exigibles."]);
  items.push([text.length>250,"Detalle","El contenido puede ser insuficiente para una inspección completa."]);
  items.push([/FECHA|Fecha/i.test(text)&&/HORA|Hora/i.test(text),"Cronología","Faltan referencias temporales claras."]);
  items.push([/HECHOS|observad/i.test(text),"Hechos objetivos","No se identifica claramente el apartado de hechos observados."]);
  items.push([/MEDIDAS|medida/i.test(text),"Medidas y resultado","No consta cómo finaliza la actuación o qué medidas se adoptan."]);
  items.push([!/_{3,}/.test(text),"Variables pendientes","Quedan campos con guiones pendientes de completar."]);
  $("#paReviewResults").innerHTML=items.map(([ok,title,desc])=>`<div class="pa-review-item ${ok?"ok":"warn"}"><b>${ok?"✓":"!"}</b><div><strong>${title}</strong><p>${ok?"Correcto":desc}</p></div></div>`).join("");
}
function setupPoliciaAdministrativa(){
  document.querySelectorAll("[data-pa-open]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();document.getElementById("sideDrawer")?.classList.remove("open");document.getElementById("drawerBackdrop")?.classList.remove("open");paOpen()}));
  document.querySelectorAll("[data-pa-view]").forEach(b=>b.onclick=()=>paShow(b.dataset.paView));
  document.querySelectorAll("[data-pa-template]").forEach(b=>b.onclick=()=>paSelectTemplate(b.dataset.paTemplate));
  document.querySelectorAll("[data-pa-area]").forEach(b=>b.onclick=()=>paOpenArea(b.dataset.paArea));
  document.querySelectorAll("[data-pa-material]").forEach(b=>b.onclick=()=>paOpenMaterial(b.dataset.paMaterial));
  $("#paBackButton").onclick=paClose;$("#paMenuButton").onclick=()=>$("#paWorkspace").classList.toggle("pa-menu-open");
  $("#paHelpButton").onclick=()=>alert("POLICÍA ADMINISTRATIVA\n\nSelecciona una plantilla o una lista de comprobación. Completa únicamente hechos comprobados y revisa el formulario y la normativa vigente antes de tramitar.");
  $("#paSaveButton").onclick=paSave;$("#paNewFormButton").onclick=()=>paSelectTemplate("a10-general");
  $("#paTemplateSearch").oninput=paRenderTemplates;$("#paTemplateCategory").onchange=paRenderTemplates;
  $("#paChecklistSearch").oninput=paRenderChecklists;$("#paChecklistArea").onchange=paRenderChecklists;
  $("#paGenerateButton").onclick=()=>$("#paOutput").value=paBuild();$("#paCopyButton").onclick=paCopy;$("#paImproveButton").onclick=paImprove;
  $("#paClearButton").onclick=()=>{if(confirm("¿Borrar el texto actual?"))$("#paOutput").value=""};
  $("#paPrintButton").onclick=()=>{if(!$("#paOutput").value.trim())$("#paOutput").value=paBuild();const w=window.open("","_blank");if(!w)return toast("Ventana bloqueada");const safe=$("#paOutput").value.replace(/[&<>]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[m]));w.document.write(`<html><head><meta charset="utf-8"><title>${paCurrent.code}</title><style>body{font-family:Arial;padding:36px;white-space:pre-wrap;line-height:1.55}</style></head><body>${safe}</body></html>`);w.document.close();w.print()};
  $("#paRunReview").onclick=paReview;$("#paMaterialExternal").onclick=()=>window.open(paMaterialUrl,"_blank");
  $("#paGlobalSearch").oninput=e=>{paShow("forms");$("#paTemplateSearch").value=e.target.value;paRenderTemplates()};
  document.addEventListener("keydown",e=>{if(!$("#paWorkspace").hidden&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#paGlobalSearch").focus()}});
}

function init(){setupCatalog();setupDrawer();setupDrawerBehaviourFix();setupDesktopMenuFix();setupAI();setupDocuments();setupSuite();setupNav();setupTicket();setupAtestados();setupAtestadosManager();setupAtestadosPolish();setupFullscreenAndButtons();setupSeguridadCiudadana();setupWeaponsCatalogue();setupPoliciaAdministrativa();setupDesktopRail();console.log('TrafficCop Pro 3.7.0 iniciado correctamente')}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
