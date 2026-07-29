
const DATA_URL = "infracciones.json";
const state = {
  data: [],
  view: "all",
  favorites: new Set(JSON.parse(localStorage.getItem("tcp-favorites") || "[]")),
  recent: JSON.parse(localStorage.getItem("tcp-recent") || "[]"),
  installPrompt: null
};
const $ = selector => document.querySelector(selector);

function normalize(value){
  return String(value ?? "").normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase();
}

async function init(){
  const response = await fetch(DATA_URL, {cache:"no-store"});
  if(!response.ok) throw new Error(`HTTP ${response.status}`);
  state.data = await response.json();

  const norms = [...new Set(state.data.map(item => item.norma))].sort();
  $("#normFilter").innerHTML =
    '<option value="">Todas las normas</option>' +
    norms.map(norm => `<option>${escapeHtml(norm)}</option>`).join("");

  const terms = ["Móvil","ITV","VMP","Matrícula","Alcohol","Drogas","Velocidad","Estacionamiento"];
  $("#chips").innerHTML = terms.map(term => `<button class="chip" data-query="${term}">${term}</button>`).join("");

  bindEvents();
  applyTheme();
  registerSW();
  render();
}

function bindEvents(){
  ["searchInput","normFilter","pointsFilter"].forEach(id => $("#"+id).addEventListener("input",render));

  $("#chips").addEventListener("click",event=>{
    if(!event.target.dataset.query) return;
    $("#searchInput").value = event.target.dataset.query;
    render();
  });

  document.querySelectorAll(".shortcuts button").forEach(button=>{
    button.addEventListener("click",()=>{
      $("#searchInput").value = button.dataset.query;
      render();
      window.scrollTo({top:360,behavior:"smooth"});
    });
  });

  document.querySelectorAll("[data-view]").forEach(button=>{
    button.addEventListener("click",()=>setView(button.dataset.view));
  });

  $("#themeButton").addEventListener("click",()=>{
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("tcp-theme",document.documentElement.classList.contains("dark")?"dark":"light");
  });

  $("#voiceButton").addEventListener("click",voiceSearch);
  $("#installButton").addEventListener("click",installApp);

  window.addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();
    state.installPrompt = event;
  });
}

function applyTheme(){
  if(localStorage.getItem("tcp-theme")==="dark") document.documentElement.classList.add("dark");
}

function setView(view){
  state.view = view;
  document.querySelectorAll("[data-view]").forEach(button=>button.classList.toggle("active",button.dataset.view===view));
  render();
}

function getItems(){
  const query = normalize($("#searchInput").value);
  const norm = $("#normFilter").value;
  const points = $("#pointsFilter").value;

  let items = state.data.filter(item=>{
    const haystack = normalize([
      item.titulo,item.descripcion,item.norma,item.norma_completa,item.articulo,item.opcion,item.categoria,
      ...(item.palabras_clave||[])
    ].join(" "));
    return (!query || haystack.includes(query))
      && (!norm || item.norma===norm)
      && (points==="" || String(item.puntos)===points);
  });

  if(state.view==="favorites") items = items.filter(item=>state.favorites.has(item.id));
  if(state.view==="recent"){
    const order = new Map(state.recent.map((id,index)=>[id,index]));
    items = items.filter(item=>order.has(item.id)).sort((a,b)=>order.get(a.id)-order.get(b.id));
  }
  return items;
}

function render(){
  const items = getItems();
  $("#count").textContent = `${items.length} resultado${items.length===1?"":"s"}`;
  const container = $("#results");
  container.innerHTML = "";

  if(!items.length){
    container.innerHTML = '<div class="empty">No se han encontrado coincidencias.</div>';
    return;
  }

  items.forEach(item=>{
    const fragment = $("#cardTemplate").content.cloneNode(true);
    const set = (selector,value)=>fragment.querySelector(selector).textContent = value ?? "—";

    set(".norm",item.norma); set(".status",item.estado); set(".title",item.titulo);
    set(".description",item.descripcion); set(".article",item.articulo); set(".option",item.opcion);
    set(".amount",`${item.importe} €`); set(".points",item.puntos); set(".normfull",item.norma_completa);
    set(".responsible",item.responsable); set(".grade",item.calificacion);
    set(".reduction",item.reduccion?"Sí":"No"); set(".validity",item.vigencia);
    set(".source",item.fuente); set(".notes",item.observaciones);

    const favoriteButton = fragment.querySelector(".favorite");
    favoriteButton.textContent = state.favorites.has(item.id) ? "★" : "☆";
    favoriteButton.addEventListener("click",()=>toggleFavorite(item.id));

    fragment.querySelector("details").addEventListener("toggle",event=>{
      if(event.target.open) addRecent(item.id);
    });

    fragment.querySelector(".copy").addEventListener("click",()=>copyItem(item));
    fragment.querySelector(".share").addEventListener("click",()=>shareItem(item));

    container.appendChild(fragment);
  });
}

function toggleFavorite(id){
  state.favorites.has(id) ? state.favorites.delete(id) : state.favorites.add(id);
  localStorage.setItem("tcp-favorites",JSON.stringify([...state.favorites]));
  render();
}

function addRecent(id){
  state.recent = [id,...state.recent.filter(existing=>existing!==id)].slice(0,30);
  localStorage.setItem("tcp-recent",JSON.stringify(state.recent));
}

function textFor(item){
  return `${item.norma} · Art. ${item.articulo} · Opción ${item.opcion}
${item.descripcion}
Importe: ${item.importe} € · Puntos: ${item.puntos}`;
}

async function copyItem(item){
  await navigator.clipboard.writeText(textFor(item));
  addRecent(item.id);
  alert("Concepto copiado.");
}

async function shareItem(item){
  addRecent(item.id);
  if(navigator.share) await navigator.share({title:item.titulo,text:textFor(item)});
  else{
    await navigator.clipboard.writeText(textFor(item));
    alert("Concepto copiado para compartir.");
  }
}

function voiceSearch(){
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!Recognition){
    alert("La búsqueda por voz no está disponible en este navegador.");
    return;
  }
  const recognition = new Recognition();
  recognition.lang = "es-ES";
  recognition.onresult = event=>{
    $("#searchInput").value = event.results[0][0].transcript;
    render();
  };
  recognition.start();
}

async function installApp(){
  if(state.installPrompt){
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
  }else{
    alert("iPhone: Safari → Compartir → Añadir a pantalla de inicio.\nAndroid: Chrome → menú → Instalar aplicación.");
  }
}

function registerSW(){
  if("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
}

function escapeHtml(value){
  return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}

init().catch(error=>{
  console.error(error);
  $("#results").innerHTML = `<div class="empty">Error al cargar la aplicación: ${error.message}</div>`;
});
