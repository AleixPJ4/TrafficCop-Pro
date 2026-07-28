
const DEMO_URL="data/infracciones.json";
const S={data:[],view:"all",fav:new Set(JSON.parse(localStorage.getItem("tcp-fav")||"[]")),recent:JSON.parse(localStorage.getItem("tcp-rec")||"[]"),deferred:null};
const $=s=>document.querySelector(s);

function norm(s){return String(s??"").normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase()}
async function load(){
 const local=localStorage.getItem("tcp-db");
 S.data=local?JSON.parse(local):await (await fetch(DEMO_URL)).json();
 setup(); render();
}
function setup(){
 const norms=[...new Set(S.data.map(x=>x.norma))].sort();
 $("#norma").innerHTML='<option value="">Todas las normas</option>'+norms.map(n=>`<option>${esc(n)}</option>`).join("");
 const cats=["Móvil","Cinturón","ITV","Matrícula","VMP","Alcohol","Drogas","Velocidad","Estacionamiento"];
 $("#quick").innerHTML=cats.map(c=>`<button class="chip" data-q="${c}">${c}</button>`).join("");
 $("#quick").onclick=e=>{if(e.target.dataset.q){$("#q").value=e.target.dataset.q;render()}};
 ["q","norma","puntos","estado"].forEach(id=>$("#"+id).addEventListener("input",render));
 document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>setView(b.dataset.view));
 $("#favBtn").onclick=()=>setView("fav"); $("#homeBtn").onclick=()=>setView("all");
 $("#toolsBtn").onclick=()=>$("#tools").showModal();
 $("#theme").onclick=()=>{document.documentElement.classList.toggle("dark");localStorage.setItem("tcp-theme",document.documentElement.classList.contains("dark")?"dark":"light")};
 if(localStorage.getItem("tcp-theme")==="dark")document.documentElement.classList.add("dark");
 $("#importBtn").onclick=()=>$("#fileInput").click();
 $("#fileInput").onchange=importDB;
 $("#exportBtn").onclick=exportDB;
 $("#clearLocalBtn").onclick=()=>{localStorage.removeItem("tcp-db");location.reload()};
 $("#installBtn").onclick=installApp;
 $("#voice").onclick=voiceSearch;
 window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();S.deferred=e});
 if("serviceWorker"in navigator)navigator.serviceWorker.register("service-worker.js");
}
function setView(v){S.view=v;document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===v));render();window.scrollTo({top:0,behavior:"smooth"})}
function filtered(){
 const q=norm($("#q").value), n=$("#norma").value,p=$("#puntos").value,e=$("#estado").value;
 let arr=S.data.filter(x=>{
  const h=norm([x.titulo,x.descripcion,x.norma,x.norma_completa,x.articulo,x.opcion,x.categoria,...(x.palabras_clave||[])].join(" "));
  return(!q||h.includes(q))&&(!n||x.norma===n)&&(p===""||String(x.puntos)===p)&&(!e||x.estado===e)
 });
 if(S.view==="fav")arr=arr.filter(x=>S.fav.has(x.id));
 if(S.view==="recent"){const order=new Map(S.recent.map((id,i)=>[id,i]));arr=arr.filter(x=>order.has(x.id)).sort((a,b)=>order.get(a.id)-order.get(b.id))}
 return arr;
}
function render(){
 const arr=filtered();$("#count").textContent=`${arr.length} resultado${arr.length===1?"":"s"}`;const out=$("#results");out.innerHTML="";
 if(!arr.length){out.innerHTML='<div class="empty">No se han encontrado coincidencias.</div>';return}
 arr.forEach(x=>{
  const f=$("#tpl").content.cloneNode(true);
  const set=(s,v)=>f.querySelector(s).textContent=v??"—";
  set(".norm",x.norma);set(".status",x.estado);f.querySelector(".status").classList.add(x.estado);
  set(".title",x.titulo);set(".desc",x.descripcion);set(".art",x.articulo);set(".opt",x.opcion);
  set(".amount",`${x.importe} €`);set(".pts",x.puntos);set(".normfull",x.norma_completa);set(".resp",x.responsable);
  set(".grade",x.calificacion);set(".red",x.reduccion?"Sí":"No");set(".vig",x.vigencia);set(".source",x.fuente);set(".notes",x.observaciones);
  const star=f.querySelector(".star");star.textContent=S.fav.has(x.id)?"★":"☆";star.onclick=()=>{S.fav.has(x.id)?S.fav.delete(x.id):S.fav.add(x.id);localStorage.setItem("tcp-fav",JSON.stringify([...S.fav]));render()};
  f.querySelector("details").ontoggle=ev=>{if(ev.target.open)addRecent(x.id)};
  f.querySelector(".copy").onclick=()=>copyText(x);
  f.querySelector(".share").onclick=()=>share(x);
  out.appendChild(f)
 })
}
function addRecent(id){S.recent=[id,...S.recent.filter(x=>x!==id)].slice(0,30);localStorage.setItem("tcp-rec",JSON.stringify(S.recent))}
function text(x){return `${x.norma} · Art. ${x.articulo} · Opción ${x.opcion}\n${x.descripcion}\nImporte: ${x.importe} € · Puntos: ${x.puntos}\nEstado: ${x.estado}`}
async function copyText(x){await navigator.clipboard.writeText(text(x));addRecent(x.id);alert("Concepto copiado")}
async function share(x){addRecent(x.id);if(navigator.share)await navigator.share({title:x.titulo,text:text(x)});else await navigator.clipboard.writeText(text(x))}
function esc(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
async function importDB(ev){
 const file=ev.target.files[0];if(!file)return;
 try{
  const data=JSON.parse(await file.text());
  if(!Array.isArray(data)||!data.every(x=>x.id&&x.titulo&&x.norma))throw new Error();
  localStorage.setItem("tcp-db",JSON.stringify(data));alert(`Base importada: ${data.length} fichas`);location.reload()
 }catch{alert("JSON no válido. Debe ser un array de fichas con id, título y norma.")}
}
function exportDB(){
 const blob=new Blob([JSON.stringify(S.data,null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="trafficcop_base.json";a.click();URL.revokeObjectURL(a.href)
}
async function installApp(){
 if(S.deferred){S.deferred.prompt();await S.deferred.userChoice;S.deferred=null}
 else alert("iPhone: abre la web en Safari → Compartir → Añadir a pantalla de inicio.\nAndroid: menú del navegador → Instalar aplicación.")
}
function voiceSearch(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){alert("La búsqueda por voz no está disponible en este navegador.");return}
 const r=new SR();r.lang="es-ES";r.onresult=e=>{$("#q").value=e.results[0][0].transcript;render()};r.start()
}
load().catch(()=>$("#results").innerHTML='<div class="empty">Error al cargar la aplicación.</div>');
