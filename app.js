
const routes={
  home:{title:"Inicio",eyebrow:"PANEL PRINCIPAL"},
  traffic:{title:"Tráfico",eyebrow:"CATÁLOGO Y HERRAMIENTAS",src:"modules/traffic.html"},
  atestados:{title:"Atestados y diligencias",eyebrow:"GESTIÓN DE ATESTADOS",src:"modules/atestados.html"},
  seguridad:{title:"LO 4/2015 · Seguridad ciudadana",eyebrow:"SEGURIDAD CIUDADANA",src:"modules/seguridad.html"},
  administrativa:{title:"Policía administrativa",eyebrow:"INSPECCIONES Y ACTAS",src:"modules/administrativa.html"},
  weapons:{title:"Catálogo de armas prohibidas",eyebrow:"DOCUMENTACIÓN",docs:["catalogo-armas-prohibidas.pdf"]},
  docs:{title:"Documentación",eyebrow:"MATERIAL INTEGRADO",docs:["policia-administrativa-uf6-2-2024.pdf","exemple-acta-inspeccio-bar-musical.pdf","exemple-acta-seguretat-privada-a10.pdf"]}
};
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
function closeMenu(){$("#sidebar").classList.remove("open");$("#backdrop").classList.remove("show")}
function navigate(route){
  const cfg=routes[route]||routes.home;
  $("#sectionTitle").textContent=cfg.title;$("#sectionEyebrow").textContent=cfg.eyebrow;
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.route===route));
  $("#homeDashboard").hidden=true;$("#frameView").hidden=true;$("#docsView").hidden=true;
  if(route==="home")$("#homeDashboard").hidden=false;
  else if(cfg.src){$("#frameView").hidden=false;const f=$("#moduleFrame");if(!f.src.endsWith(cfg.src))f.src=cfg.src}
  else if(cfg.docs){$("#docsView").hidden=false;$("#docsTitle").textContent=cfg.title;$("#docsList").innerHTML=cfg.docs.map(name=>`<a class="doc-link" target="_blank" href="docs/${name}"><span>${name}</span><small>Abrir PDF</small></a>`).join("")}
  history.replaceState(null,"","#"+route);closeMenu();
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-route]");if(b){e.preventDefault();navigate(b.dataset.route)}});
$("#menuToggle").onclick=()=>{$("#sidebar").classList.toggle("open");$("#backdrop").classList.toggle("show")};
$("#backdrop").onclick=closeMenu;
window.addEventListener("message",e=>{if(e.data?.type==="trafficcop-route")navigate(e.data.route)});
navigate(location.hash.replace("#","")||"home");
