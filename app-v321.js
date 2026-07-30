
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

function init(){setupCatalog();setupDrawer();setupAI();setupDocuments();setupSuite();setupNav();setupTicket();setupDesktopRail();console.log('TrafficCop Pro 3.2.1 iniciado correctamente')}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
