
const state = {
  view: "all",
  favorites: new Set(JSON.parse(localStorage.getItem("tcp-v06-favorites") || "[]")),
  limit: 50
};
const $ = selector => document.querySelector(selector);

function normalize(value){
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase();
}

function setup(){
  const norms = [...new Set(INFRACCIONS.map(item => item.norma))].sort();
  $("#normFilter").innerHTML =
    '<option value="">Totes les normes</option>' +
    norms.map(norm => `<option>${norm}</option>`).join("");

  ["searchInput","normFilter","natureFilter","pointsFilter"].forEach(id=>{
    $("#"+id).addEventListener("input",()=>{state.limit=50;render();});
  });

  document.querySelectorAll("[data-query]").forEach(button=>{
    button.addEventListener("click",()=>{
      $("#searchInput").value = button.dataset.query;
      state.limit=50;
      render();
    });
  });

  document.querySelectorAll("[data-view]").forEach(button=>{
    button.addEventListener("click",()=>{
      state.view = button.dataset.view;
      state.limit=50;
      document.querySelectorAll("[data-view]").forEach(item=>{
        item.classList.toggle("active",item.dataset.view===state.view);
      });
      render();
    });
  });

  $("#clearButton").addEventListener("click",()=>{
    $("#searchInput").value="";
    $("#normFilter").value="";
    $("#natureFilter").value="";
    $("#pointsFilter").value="";
    state.limit=50;
    render();
  });

  $("#moreButton").addEventListener("click",()=>{
    state.limit += 50;
    render();
  });

  $("#themeButton").addEventListener("click",()=>{
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("tcp-v06-theme",document.documentElement.classList.contains("dark")?"dark":"light");
  });

  if(localStorage.getItem("tcp-v06-theme")==="dark"){
    document.documentElement.classList.add("dark");
  }

  $("#installButton").addEventListener("click",()=>{
    alert("iPhone: Safari → Compartir → Afegir a la pantalla d’inici.\nAndroid: Chrome → menú → Instal·lar aplicació.");
  });

  render();
}

function filteredItems(){
  const query = normalize($("#searchInput").value);
  const norm = $("#normFilter").value;
  const nature = $("#natureFilter").value;
  const points = $("#pointsFilter").value;

  let items = INFRACCIONS.filter(item=>{
    const searchable = normalize([
      item.concepte,item.article,item.norma,item.norma_completa,item.categoria,
      item.quantia,item.descompte,item.punts,item.naturalesa
    ].join(" "));

    return (!query || searchable.includes(query))
      && (!norm || item.norma===norm)
      && (!nature || item.naturalesa===nature)
      && (points==="" || String(item.punts).replace("*","")===points);
  });

  if(state.view==="favorites"){
    items = items.filter(item=>state.favorites.has(item.id));
  }
  return items;
}

function render(){
  const all = filteredItems();
  const visible = all.slice(0,state.limit);
  $("#resultCount").textContent = `${all.length} resultats`;
  $("#results").innerHTML = "";

  if(!visible.length){
    $("#results").innerHTML = '<div class="empty">No s’han trobat coincidències.</div>';
    $("#moreButton").hidden = true;
    return;
  }

  visible.forEach(item=>{
    const fragment = $("#cardTemplate").content.cloneNode(true);
    const set = (selector,value)=>fragment.querySelector(selector).textContent=value || "—";

    set(".norm",item.norma);
    set(".nature",item.naturalesa);
    set(".concept",item.concepte);
    set(".category",item.categoria);
    set(".article",item.article);
    set(".amount",formatEuro(item.quantia));
    set(".discount",formatEuro(item.descompte));
    set(".points",item.punts);
    set(".normFull",item.norma_completa);
    set(".natureFull",natureText(item.naturalesa));
    set(".page",`Pàgina ${item.pagina}`);
    set(".status",item.estat);
    set(".withdrawal",item.proposta_retirada || "—");

    const favorite = fragment.querySelector(".favorite");
    favorite.textContent = state.favorites.has(item.id) ? "★" : "☆";
    favorite.addEventListener("click",()=>{
      state.favorites.has(item.id) ? state.favorites.delete(item.id) : state.favorites.add(item.id);
      localStorage.setItem("tcp-v06-favorites",JSON.stringify([...state.favorites]));
      render();
    });

    fragment.querySelector(".copy").addEventListener("click",async()=>{
      await navigator.clipboard.writeText(itemText(item));
      alert("Concepte copiat.");
    });

    fragment.querySelector(".share").addEventListener("click",async()=>{
      if(navigator.share){
        await navigator.share({title:"TrafficCop Pro",text:itemText(item)});
      }else{
        await navigator.clipboard.writeText(itemText(item));
        alert("Concepte copiat per compartir.");
      }
    });

    $("#results").appendChild(fragment);
  });

  $("#moreButton").hidden = visible.length >= all.length;
}

function natureText(value){
  return {"L":"Lleu","G":"Greu","MG":"Molt greu","G/MG":"Greu / molt greu","—":"Sense classificació"}[value] || value;
}

function formatEuro(value){
  if(!value || value==="—") return "—";
  if(normalize(value).includes("barem")) return value;
  if(value==="NO") return "NO";
  return `${value} €`;
}

function itemText(item){
  return `${item.concepte}
${item.norma} · Art. ${item.article}
Naturalesa: ${natureText(item.naturalesa)}
Quantia: ${formatEuro(item.quantia)}
Descompte: ${formatEuro(item.descompte)}
Punts: ${item.punts}
Font: Catàleg SCT de 20 de maig de 2026, pàgina ${item.pagina}`;
}


const SYNONYMS = {
  "mobil":["telefon","smartphone","dispositiu","trucant","whatsapp","pantalla"],
  "telefon":["mobil","smartphone","dispositiu"],
  "itv":["inspeccio tecnica","caducada","desfavorable","negativa"],
  "vmp":["patinet","vehicle mobilitat personal"],
  "matricula":["placa","plaques","illegible","manipulada","obstacle"],
  "alcohol":["alcoholemia","etilometre","taxa","aire espirat"],
  "drogues":["droga","estupefaents","substancies"],
  "cinturo":["seguretat","retencio"],
  "casc":["motocicleta","ciclomotor"],
  "velocitat":["radar","cinemometre","limit"],
  "semafor":["llum vermell","vermell"],
  "stop":["aturada","senyal r-2"],
  "acera":["vorera","zona vianants"],
  "contrari":["sentit contrari","direccio contraria"],
  "estacionat":["estacionament","aparcat","parada"],
  "auriculars":["cascos","reproductor so"],
  "inhibidor":["radar","cinemometre","interferir"]
};

function tokenize(text){
  const raw = normalize(text).replace(/[^a-z0-9à-ÿ\s]/g," ").split(/\s+/).filter(token=>token.length>2);
  const expanded = new Set(raw);
  raw.forEach(token => (SYNONYMS[token] || []).forEach(item => normalize(item).split(/\s+/).forEach(part=>expanded.add(part))));
  return [...expanded];
}

function smartScore(item,tokens,fullQuery){
  const concept = normalize(item.concepte);
  const category = normalize(item.categoria);
  const article = normalize(item.article);
  const norm = normalize(item.norma);
  let score = 0;

  if(concept.includes(fullQuery) && fullQuery.length>3) score += 70;
  tokens.forEach(token=>{
    if(concept.includes(token)) score += 15;
    if(category.includes(token)) score += 8;
    if(article===token || article.includes(token)) score += 7;
    if(norm===token) score += 5;
  });

  const phraseBonuses = [
    ["amb la ma",["mantenint-lo amb la ma","telefonia mobil"],30],
    ["sentit contrari",["sentit contrari"],28],
    ["sense itv",["inspeccio tecnica"],22],
    ["matricula illegible",["plaques matricules","lectura"],28],
    ["patinet vorera",["vehicle de mobilitat personal","zona de vianants"],25],
    ["telefon mobil",["telefonia mobil"],22],
    ["conduccio temeraria",["forma temeraria"],30],
    ["conduccio negligent",["forma negligent"],30]
  ];
  phraseBonuses.forEach(([trigger,needles,bonus])=>{
    if(fullQuery.includes(trigger) && needles.every(needle=>concept.includes(normalize(needle)))) score += bonus;
  });
  return score;
}

function analyzeAssistant(){
  const text = $("#assistantText").value.trim();
  const target = $("#assistantResults");
  if(!text){
    $("#assistantStatus").textContent = "Escriu o dicta una descripció dels fets.";
    target.innerHTML = "";
    return;
  }

  const fullQuery = normalize(text);
  const tokens = tokenize(text);
  const ranked = INFRACCIONS
    .map(item=>({item,score:smartScore(item,tokens,fullQuery)}))
    .filter(entry=>entry.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,8);

  $("#assistantStatus").textContent = ranked.length
    ? `S'han localitzat ${ranked.length} possibles coincidències. Revisa quina s'ajusta exactament als fets.`
    : "No s'ha trobat una coincidència clara. Prova amb paraules més concretes.";

  target.innerHTML = "";
  ranked.forEach(({item,score},index)=>{
    const card = document.createElement("article");
    card.className = "ai-result";
    card.innerHTML = `
      <span class="ai-score">COINCIDÈNCIA ${index+1} · PUNTUACIÓ ${score}</span>
      <h4></h4>
      <p></p>
      <div class="ai-meta">
        <span>${item.norma}</span>
        <span>Art. ${item.article}</span>
        <span>${natureText(item.naturalesa)}</span>
        <span>${formatEuro(item.quantia)}</span>
        <span>${item.punts} punts</span>
      </div>
      <button>Obrir aquesta infracció</button>
    `;
    card.querySelector("h4").textContent = item.concepte;
    card.querySelector("p").textContent = item.categoria;
    card.querySelector("button").addEventListener("click",()=>{
      $("#assistantDialog").close();
      $("#searchInput").value = item.concepte;
      state.view = "all";
      state.limit = 50;
      render();
      window.scrollTo({top:360,behavior:"smooth"});
    });
    target.appendChild(card);
  });
}

function startSpeech(targetInput,button){
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!Recognition){
    alert("Aquest navegador no ofereix reconeixement de veu directe. A l'iPhone pots tocar el micròfon del teclat per dictar el text.");
    targetInput.focus();
    return;
  }

  const recognition = new Recognition();
  recognition.lang = "ca-ES";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  button.classList.add("listening");
  button.textContent = "🔴 Escoltant…";

  recognition.onresult = event=>{
    targetInput.value = event.results[0][0].transcript;
    if(targetInput.id==="searchInput"){
      state.limit=50;
      render();
    }else{
      analyzeAssistant();
    }
  };
  recognition.onerror = ()=>alert("No s'ha pogut reconèixer la veu. Torna-ho a provar o utilitza el dictat del teclat.");
  recognition.onend = ()=>{
    button.classList.remove("listening");
    button.textContent = button.id==="assistantMicButton" ? "🎙 Dictar" : "🎙";
  };
  recognition.start();
}

function setupVoiceAndAI(){
  $("#voiceSearchButton").addEventListener("click",()=>startSpeech($("#searchInput"),$("#voiceSearchButton")));
  $("#assistantOpenButton").addEventListener("click",()=>{
    $("#assistantDialog").showModal();
    setTimeout(()=>$("#assistantText").focus(),100);
  });
  $("#assistantCloseButton").addEventListener("click",()=>$("#assistantDialog").close());
  $("#assistantAnalyzeButton").addEventListener("click",analyzeAssistant);
  $("#assistantMicButton").addEventListener("click",()=>startSpeech($("#assistantText"),$("#assistantMicButton")));
  $("#assistantText").addEventListener("keydown",event=>{
    if((event.ctrlKey || event.metaKey) && event.key==="Enter") analyzeAssistant();
  });
}


const LEGAL_PAGES = {
  source: {
    title: "Font i vigència",
    html: `
      <p>La base de consulta procedeix del <strong>Catàleg d’infraccions del Servei Català de Trànsit</strong>, datat a Barcelona el 20 de maig de 2026.</p>
      <div class="legal-callout">Cada fitxa mostra la pàgina d’origen perquè l’agent pugui contrastar el redactat amb el document font.</div>
      <h3>Normatives incloses</h3>
      <ul>
        <li>Text refós de la Llei de seguretat viària.</li>
        <li>Reglament general de circulació.</li>
        <li>Reglament general de conductors.</li>
        <li>Reglament general de vehicles.</li>
        <li>Assegurança obligatòria de vehicles.</li>
        <li>Reglament d’escoles particulars de conductors.</li>
      </ul>`
  },
  structure: {
    title: "Estructura del catàleg",
    html: `
      <p>Les fitxes del catàleg s’organitzen mitjançant les dades següents:</p>
      <ul>
        <li>Concepte de la infracció.</li>
        <li>Article i apartat infringits.</li>
        <li>Naturalesa: lleu, greu o molt greu.</li>
        <li>Quantia de la multa.</li>
        <li>Import amb reducció del 50 %, quan sigui aplicable.</li>
        <li>Pèrdua de punts.</li>
      </ul>`
  },
  instructions: {
    title: "Instruccions d’ús",
    html: `
      <p>Abans de formular una denúncia cal comprovar que el fet observat encaixa amb el concepte codificat.</p>
      <div class="legal-callout">Quan el redactat exigeixi indicar conducta, perill, danys, lloc, mecanisme o qualsevol altra circumstància, aquestes dades s’han de completar al butlletí.</div>
      <p>Si el fet no encaixa perfectament amb cap opció, el redactat s’ha d’adaptar al fet realment observat i s’ha de consignar l’article que es consideri aplicable.</p>`
  },
  classification: {
    title: "Classificació de les infraccions",
    html: `
      <h3>L — Lleu</h3><p>Infracció qualificada com a lleu al catàleg.</p>
      <h3>G — Greu</h3><p>Infracció qualificada com a greu.</p>
      <h3>MG — Molt greu</h3><p>Infracció qualificada com a molt greu.</p>
      <p>Algunes infraccions de velocitat apareixen com a G/MG perquè la qualificació depèn del barem aplicable.</p>`
  },
  discount: {
    title: "Reducció del 50 %",
    html: `
      <p>La columna «50 %» mostra l’import reduït quan el procediment sancionador permet el pagament amb reducció.</p>
      <p>Quan el catàleg indica «NO», no s’aplica aquesta reducció. Quan indica «Veure barem», cal consultar el barem corresponent.</p>`
  },
  points: {
    title: "Pèrdua de punts",
    html: `
      <p>La fitxa mostra els punts associats a la infracció segons el catàleg.</p>
      <div class="legal-callout">Les sancions a conductors de bicicletes o VMP no comporten detracció de punts quan el mateix catàleg així ho indica.</div>`
  },
  privacy: {
    title: "Privacitat",
    html: `
      <p>La consulta, els favorits i l’assistent local es processen al dispositiu.</p>
      <p>No s’han d’introduir noms, documents d’identitat, matrícules vinculades a persones ni altres dades policials sensibles en serveis externs no autoritzats.</p>`
  },
  disclaimer: {
    title: "Avís legal",
    html: `
      <p>TrafficCop Pro és una eina de consulta i suport. No substitueix el catàleg oficial, la normativa vigent ni el criteri professional de l’agent.</p>
      <p>Abans de denunciar, cal verificar que la fitxa correspon exactament als fets i que no hi ha hagut modificacions normatives posteriors.</p>`
  },
  errors: {
    title: "Comunicar errors",
    html: `
      <p>Per comunicar un possible error, anota:</p>
      <ul>
        <li>Concepte afectat.</li>
        <li>Norma i article.</li>
        <li>Pàgina del catàleg.</li>
        <li>Dada que consideres incorrecta.</li>
      </ul>
      <p>Fins que una incidència no sigui contrastada amb el PDF, no s’ha de modificar el text oficial de la fitxa.</p>`
  },
  version: {
    title: "Versió de l’aplicació",
    html: `
      <p><strong>TrafficCop Pro v2.0</strong></p>
      <p>Inclou menú lateral legal, filtres per normativa, favorits, cerca per veu i assistent local de coincidències.</p>
      <p>Base documental: Catàleg SCT de 20 de maig de 2026.</p>`
  }
};


const SUBMENUS = {
  legislation: {
    eyebrow: "BIBLIOTECA LEGAL",
    title: "Legislació",
    items: [
      {icon:"📘",label:"TRLSV",description:"Llei de trànsit i seguretat viària",norm:"TRLSV"},
      {icon:"🚦",label:"Reglament general de circulació",description:"Normes de comportament i circulació",norm:"RGC"},
      {icon:"🚗",label:"Reglament general de vehicles",description:"Condicions tècniques, ITV i vehicles",norm:"RGV"},
      {icon:"🪪",label:"Reglament general de conductors",description:"Permisos, llicències i autoritzacions",norm:"RGCond"},
      {icon:"🛡",label:"Assegurança obligatòria",description:"Responsabilitat civil i assegurança",norm:"SOA"},
      {icon:"🏫",label:"Escoles de conductors",description:"Reglament d’escoles particulars",norm:"REPC"},
      {section:"INFORMACIÓ DEL CATÀLEG"},
      {icon:"ⓘ",label:"Font i vigència",description:"Document font i data",legal:"source"},
      {icon:"▤",label:"Estructura del catàleg",description:"Camps de cada fitxa",legal:"structure"},
      {icon:"✓",label:"Instruccions d’ús",description:"Com aplicar el redactat",legal:"instructions"},
      {icon:"⚖",label:"Classificació",description:"Lleu, greu i molt greu",legal:"classification"}
    ]
  },
  traffic: {
    eyebrow: "CONSULTA RÀPIDA",
    title: "Trànsit",
    items: [
      {icon:"📱",label:"Distraccions i mòbil",description:"Telèfon, pantalles i auriculars",query:"mòbil"},
      {icon:"🚦",label:"Senyals i semàfors",description:"Ordres, prioritats i senyalització",query:"senyal"},
      {icon:"🛴",label:"VMP",description:"Patinets i mobilitat personal",query:"VMP"},
      {icon:"🧾",label:"ITV",description:"Inspecció tècnica del vehicle",query:"ITV"},
      {icon:"🍺",label:"Alcoholèmia",description:"Taxes i proves",query:"alcohol"},
      {icon:"🧪",label:"Drogues",description:"Presència i proves",query:"drogues"},
      {icon:"🔢",label:"Matrícules",description:"Plaques i identificació",query:"matrícula"},
      {icon:"⚡",label:"Velocitat",description:"Límits i barems",query:"velocitat"},
      {icon:"🛞",label:"Condicions tècniques",description:"Pneumàtics, llums i equipament",query:"pneumàtic"},
      {icon:"📦",label:"Càrrega",description:"Condicionament i dimensions",query:"càrrega"},
      {icon:"🚫",label:"Parada i estacionament",description:"Supòsits i prohibicions",query:"estacionar"}
    ]
  },
  documents: {
    eyebrow: "GESTIÓ DOCUMENTAL",
    title: "Documents",
    items: [
      {icon:"📋",label:"Copiar denúncia",description:"Utilitza el botó de cada fitxa",action:"home"},
      {icon:"📝",label:"Actes policials",description:"Mòdul en preparació",disabled:true},
      {icon:"📄",label:"Diligències",description:"Mòdul en preparació",disabled:true},
      {icon:"🗣",label:"Acta de manifestació",description:"Mòdul en preparació",disabled:true}
    ]
  },
  reports: {
    eyebrow: "INFORMES",
    title: "Informes",
    items: [
      {icon:"📸",label:"Informe fotogràfic",description:"Mòdul en preparació",disabled:true},
      {icon:"🚗",label:"Accident de trànsit",description:"Mòdul en preparació",disabled:true},
      {icon:"🧭",label:"Croquis i recorreguts",description:"Mòdul en preparació",disabled:true}
    ]
  },
  tools: {
    eyebrow: "EINES PROFESSIONALS",
    title: "Eines",
    items: [
      {icon:"✨",label:"TrafficCop AI",description:"Localitza coincidències per descripció",action:"assistant"},
      {icon:"★",label:"Preferides",description:"Consulta les infraccions guardades",action:"favorites"},
      {icon:"⌕",label:"Cerca avançada",description:"Torna al cercador i filtres",action:"search"},
      {icon:"₊",label:"Calculadores",description:"Mòdul en preparació",disabled:true}
    ]
  },
  settings: {
    eyebrow: "CONFIGURACIÓ",
    title: "Ajustos",
    items: [
      {icon:"◐",label:"Canviar tema",description:"Mode clar o fosc",action:"theme"},
      {icon:"🔒",label:"Privacitat",description:"Tractament local de dades",legal:"privacy"},
      {icon:"⚠",label:"Avís legal",description:"Límits i responsabilitat",legal:"disclaimer"},
      {icon:"✎",label:"Comunicar errors",description:"Com informar d’una incidència",legal:"errors"},
      {icon:"ⓘ",label:"Versió de l’app",description:"TrafficCop Pro v2.0",legal:"version"}
    ]
  }
};

function openDrawer(){
  $("#sideDrawer").classList.add("open");
  $("#drawerBackdrop").classList.add("open");
  $("#sideDrawer").setAttribute("aria-hidden","false");
  document.body.classList.add("drawer-open");
  showDrawerMain();
}
function closeDrawer(){
  $("#sideDrawer").classList.remove("open");
  $("#drawerBackdrop").classList.remove("open");
  $("#sideDrawer").setAttribute("aria-hidden","true");
  document.body.classList.remove("drawer-open");
}
function showDrawerMain(){
  $("#drawerMain").classList.add("active");
  $("#drawerSubmenu").classList.remove("active");
}
function showSubmenu(key){
  const menu = SUBMENUS[key];
  if(!menu) return;
  $("#submenuEyebrow").textContent = menu.eyebrow;
  $("#submenuTitle").textContent = menu.title;
  const container = $("#submenuContent");
  container.innerHTML = "";

  menu.items.forEach(item=>{
    if(item.section){
      const label = document.createElement("div");
      label.className = "submenu-section-label";
      label.textContent = item.section;
      container.appendChild(label);
      return;
    }

    const button = document.createElement("button");
    button.className = "submenu-item" + (item.disabled ? " disabled" : "");
    button.innerHTML = `
      <span class="menu-icon">${item.icon}</span>
      <span class="menu-copy"><strong></strong><small></small></span>
      ${item.disabled ? "" : '<span class="chevron">›</span>'}
    `;
    button.querySelector("strong").textContent = item.label;
    button.querySelector("small").textContent = item.description;

    if(!item.disabled){
      button.addEventListener("click",()=>handleMenuItem(item));
    }
    container.appendChild(button);
  });

  $("#drawerMain").classList.remove("active");
  $("#drawerSubmenu").classList.add("active");
}

function showLegalPage(key){
  const page = LEGAL_PAGES[key];
  if(!page) return;
  $("#legalTitle").textContent = page.title;
  $("#legalContent").innerHTML = page.html;
  $("#legalDialog").showModal();
  closeDrawer();
}

function resetSearchAndViews(){
  $("#searchInput").value="";
  $("#normFilter").value="";
  $("#natureFilter").value="";
  $("#pointsFilter").value="";
  state.view="all";
  state.limit=50;
}

function filterByNorm(norm){
  resetSearchAndViews();
  $("#normFilter").value = norm;
  render();
  closeDrawer();
  window.scrollTo({top:300,behavior:"smooth"});
}

function searchByQuery(query){
  resetSearchAndViews();
  $("#searchInput").value = query;
  render();
  closeDrawer();
  window.scrollTo({top:300,behavior:"smooth"});
}

function performAction(action){
  if(action==="home"){
    resetSearchAndViews();
    render();
    closeDrawer();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  if(action==="search"){
    closeDrawer();
    window.scrollTo({top:260,behavior:"smooth"});
    setTimeout(()=>$("#searchInput").focus(),350);
  }
  if(action==="assistant"){
    closeDrawer();
    $("#assistantDialog").showModal();
    setTimeout(()=>$("#assistantText").focus(),120);
  }
  if(action==="favorites"){
    state.view="favorites";
    state.limit=50;
    document.querySelectorAll("[data-view]").forEach(item=>{
      item.classList.toggle("active",item.dataset.view==="favorites");
    });
    render();
    closeDrawer();
    window.scrollTo({top:300,behavior:"smooth"});
  }
  if(action==="theme"){
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("tcp-v06-theme",document.documentElement.classList.contains("dark")?"dark":"light");
  }
}

function handleMenuItem(item){
  if(item.norm !== undefined) filterByNorm(item.norm);
  else if(item.query) searchByQuery(item.query);
  else if(item.legal) showLegalPage(item.legal);
  else if(item.action) performAction(item.action);
}

function filterDrawerMenu(){
  const query = normalize($("#drawerSearchInput").value);
  document.querySelectorAll("#drawerMain .menu-row").forEach(row=>{
    const text = normalize(row.textContent);
    row.classList.toggle("hidden-by-search",query && !text.includes(query));
  });
}

function setupSideMenu(){
  $("#menuButton").addEventListener("click",openDrawer);
  $("#drawerCloseButton").addEventListener("click",closeDrawer);
  $("#drawerCloseButtonSecondary").addEventListener("click",closeDrawer);
  $("#drawerBackdrop").addEventListener("click",closeDrawer);
  $("#submenuBackButton").addEventListener("click",showDrawerMain);
  $("#legalCloseButton").addEventListener("click",()=>$("#legalDialog").close());
  $("#drawerSearchInput").addEventListener("input",filterDrawerMenu);

  document.querySelectorAll(".submenu-trigger").forEach(button=>{
    button.addEventListener("click",()=>showSubmenu(button.dataset.submenu));
  });

  document.querySelectorAll("#drawerMain [data-action]").forEach(button=>{
    button.addEventListener("click",()=>performAction(button.dataset.action));
  });

  document.querySelectorAll("#drawerMain [data-legal]").forEach(button=>{
    button.addEventListener("click",()=>showLegalPage(button.dataset.legal));
  });

  document.addEventListener("keydown",event=>{
    if(event.key==="Escape" && $("#sideDrawer").classList.contains("open")) closeDrawer();
  });
}


const SUITE_MODULES = {
  traffic:{
    title:"Tráfico",
    html:`
      <div class="module-grid">
        <section class="module-box"><h3>Catálogo SCT</h3><p>Accede al buscador completo de infracciones.</p><button data-suite-action="go-search">Abrir buscador</button></section>
        <section class="module-box"><h3>Favoritas</h3><p>Consulta las infracciones guardadas.</p><button data-suite-action="go-favorites">Abrir favoritas</button></section>
        <section class="module-box"><h3>Consulta por materias</h3><p>Móvil, ITV, VMP, alcohol, drogas, velocidad y más.</p><button data-suite-action="open-traffic-menu">Abrir menú</button></section>
      </div>`
  },
  ai:{
    title:"TrafficCop AI",
    html:`
      <div class="module-grid">
        <section class="module-box"><h3>Consulta por voz</h3><p>Describe los hechos y localiza posibles coincidencias del catálogo.</p><button data-suite-action="open-ai">Abrir TrafficCop AI</button></section>
        <section class="module-box"><h3>Chat jurídico</h3><p>Preparado para una futura conexión segura con IA en la nube.</p><button disabled>Próximamente</button></section>
      </div>`
  },
  documents:{
    title:"Documentos",
    html:`
      <div class="module-grid">
        <section class="module-box"><h3>Acta de manifestación</h3><p>Constructor guiado de actas.</p><button disabled>Próximamente</button></section>
        <section class="module-box"><h3>Diligencias</h3><p>Plantillas para tráfico, alcohol y drogas.</p><button disabled>Próximamente</button></section>
        <section class="module-box"><h3>Informe ampliatorio</h3><p>Redacción estructurada y exportación.</p><button disabled>Próximamente</button></section>
      </div>`
  },
  photo:{
    title:"Informe fotográfico",
    html:`
      <div class="photo-builder">
        <input id="photoFiles" type="file" accept="image/*" multiple>
        <div id="photoList" class="photo-list"></div>
        <div class="action-row">
          <button id="generatePhotoText" class="primary-action">Generar texto</button>
          <button id="copyPhotoText" class="secondary-action">Copiar informe</button>
        </div>
        <textarea id="photoOutput" rows="10" placeholder="Aquí aparecerá el informe fotográfico…"></textarea>
      </div>`
  },
  accident:{
    title:"Accidentes",
    html:`
      <div class="module-grid">
        <section class="module-box"><h3>Cronología de actuación</h3><p>Registra los hitos principales de la intervención.</p><button data-suite-action="timeline">Abrir cronología</button></section>
        <section class="module-box"><h3>Datos del accidente</h3><p>Vehículos, daños, heridos y observaciones.</p><button disabled>Próximamente</button></section>
        <section class="module-box"><h3>Croquis</h3><p>Constructor visual de señales, vehículos y trayectorias.</p><button disabled>Próximamente</button></section>
      </div>
      <div id="timelineArea"></div>`
  },
  legal:{
    title:"Biblioteca legal",
    html:`
      <div class="module-grid">
        <section class="module-box"><h3>Normativa integrada</h3><p>TRLSV, RGC, RGV, RGCond, seguro y escuelas de conductores.</p><button data-suite-action="open-legislation">Abrir legislación</button></section>
        <section class="module-box"><h3>Jurisprudencia</h3><p>Búsqueda jurídica conectada a fuentes oficiales.</p><button disabled>Próximamente</button></section>
      </div>`
  },
  patrol:{
    title:"Modo patrulla",
    html:`
      <div class="module-grid">
        <section class="module-box"><h3>Accesos grandes</h3><p>Tráfico, fotos, actas, IA y legislación.</p><button data-suite-action="go-search">Abrir modo operativo</button></section>
        <section class="module-box"><h3>Cronómetro de actuación</h3><p>Crea una línea temporal para insertar en el informe.</p><button data-suite-action="timeline">Abrir cronología</button></section>
      </div>
      <div id="timelineArea"></div>`
  },
  tools:{
    title:"Herramientas",
    html:`
      <div class="module-grid">
        <section class="module-box"><h3>Velocidad</h3><p>Acceso rápido a infracciones y baremos.</p><button data-suite-action="search-speed">Abrir velocidad</button></section>
        <section class="module-box"><h3>Alcohol y drogas</h3><p>Acceso rápido a tasas, pruebas e infracciones.</p><button data-suite-action="search-alcohol">Abrir alcohol</button></section>
        <section class="module-box"><h3>GPS y ubicación</h3><p>Captura de coordenadas para informes.</p><button data-suite-action="gps">Obtener ubicación</button></section>
        <section class="module-box"><h3>Escáner documental</h3><p>OCR de permisos, ITV y documentación.</p><button disabled>Próximamente</button></section>
      </div>
      <div id="toolOutput"></div>`
  }
};

function openSuiteModule(key){
  const module = SUITE_MODULES[key];
  if(!module) return;
  $("#suiteTitle").textContent = module.title;
  $("#suiteContent").innerHTML = module.html;
  $("#suiteDialog").showModal();
  bindSuiteActions();
  if(key==="photo") setupPhotoBuilder();
}

function bindSuiteActions(){
  document.querySelectorAll("[data-suite-action]").forEach(button=>{
    button.addEventListener("click",()=>{
      const action = button.dataset.suiteAction;
      if(action==="go-search"){
        $("#suiteDialog").close();
        window.scrollTo({top:300,behavior:"smooth"});
        setTimeout(()=>$("#searchInput").focus(),350);
      }
      if(action==="go-favorites"){
        $("#suiteDialog").close();
        state.view="favorites";state.limit=50;render();
        window.scrollTo({top:300,behavior:"smooth"});
      }
      if(action==="open-ai"){
        $("#suiteDialog").close();
        $("#assistantDialog").showModal();
      }
      if(action==="open-traffic-menu"){
        $("#suiteDialog").close();openDrawer();showSubmenu("traffic");
      }
      if(action==="open-legislation"){
        $("#suiteDialog").close();openDrawer();showSubmenu("legislation");
      }
      if(action==="search-speed"){
        $("#suiteDialog").close();searchByQuery("velocitat");
      }
      if(action==="search-alcohol"){
        $("#suiteDialog").close();searchByQuery("alcohol");
      }
      if(action==="timeline") renderTimeline();
      if(action==="gps") getGPS();
    });
  });
}

function setupPhotoBuilder(){
  const input = $("#photoFiles");
  input.addEventListener("change",()=>{
    const list = $("#photoList");
    list.innerHTML="";
    [...input.files].forEach((file,index)=>{
      const row = document.createElement("div");
      row.className="photo-row";
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      const textarea = document.createElement("textarea");
      textarea.placeholder = `Descripció fotografia núm. ${index+1}`;
      textarea.value = `Vista corresponent a la fotografia núm. ${index+1}.`;
      row.append(img,textarea);
      list.appendChild(row);
    });
  });
  $("#generatePhotoText").addEventListener("click",()=>{
    const descriptions=[...document.querySelectorAll("#photoList textarea")].map((area,index)=>`FOTOGRAFIA NÚM. ${index+1}\n${area.value.trim()}`);
    $("#photoOutput").value=descriptions.join("\n\n");
  });
  $("#copyPhotoText").addEventListener("click",async()=>{
    await navigator.clipboard.writeText($("#photoOutput").value);
    alert("Informe fotogràfic copiat.");
  });
}

function renderTimeline(){
  const area = $("#timelineArea");
  area.innerHTML = `
    <div class="timeline">
      <div class="timeline-row"><input type="time"><input placeholder="Avís rebut"><button>×</button></div>
      <div class="timeline-row"><input type="time"><input placeholder="Arribada al lloc"><button>×</button></div>
    </div>
    <div class="action-row">
      <button id="addTimelineRow" class="primary-action">Afegir fita</button>
      <button id="copyTimeline" class="secondary-action">Copiar cronologia</button>
    </div>`;
  const timeline=area.querySelector(".timeline");
  const bindRemove=()=>timeline.querySelectorAll("button").forEach(btn=>btn.onclick=()=>btn.parentElement.remove());
  bindRemove();
  $("#addTimelineRow").onclick=()=>{
    const row=document.createElement("div");row.className="timeline-row";
    row.innerHTML='<input type="time"><input placeholder="Descripció de la fita"><button>×</button>';
    timeline.appendChild(row);bindRemove();
  };
  $("#copyTimeline").onclick=async()=>{
    const lines=[...timeline.querySelectorAll(".timeline-row")].map(row=>{
      const inputs=row.querySelectorAll("input");
      return `${inputs[0].value || "--:--"} — ${inputs[1].value || ""}`;
    });
    await navigator.clipboard.writeText(lines.join("\n"));
    alert("Cronologia copiada.");
  };
}

function getGPS(){
  const output=$("#toolOutput");
  if(!navigator.geolocation){
    output.innerHTML='<p>Geolocalització no disponible.</p>';return;
  }
  output.innerHTML='<p>Obtenint ubicació…</p>';
  navigator.geolocation.getCurrentPosition(
    pos=>output.innerHTML=`<div class="legal-callout"><strong>Coordenades:</strong><br>${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}</div>`,
    ()=>output.innerHTML='<p>No s’ha pogut obtenir la ubicació.</p>',
    {enableHighAccuracy:true,timeout:10000}
  );
}

function setupSuite(){
  document.querySelectorAll("[data-suite]").forEach(button=>{
    button.addEventListener("click",()=>openSuiteModule(button.dataset.suite));
  });
  $("#suiteCloseButton").addEventListener("click",()=>$("#suiteDialog").close());
}


const DOCUMENT_TYPES = {
  manifestacion:{
    title:"Acta de manifestación",
    fields:[
      ["fecha","Fecha","date"],
      ["hora","Hora","time"],
      ["lugar","Lugar","text"],
      ["manifestante","Nombre de la persona manifestante","text"],
      ["documento","Documento identificativo","text"],
      ["agentes","Agentes actuantes / TIP","text"],
      ["hechos","Manifestación de los hechos","textarea","full"],
      ["observaciones","Observaciones adicionales","textarea","full"]
    ],
    build:v=>`ACTA DE MANIFESTACIÓN

En ${v.lugar || "__________"}, en fecha ${formatDate(v.fecha)}, a las ${v.hora || "____"} horas, ante los agentes actuantes ${v.agentes || "__________"}, comparece ${v.manifestante || "__________"}, con documento identificativo ${v.documento || "__________"}, quien manifiesta:

${v.hechos || "________________________________________________________________"}

Observaciones:
${v.observaciones || "Sin observaciones adicionales."}

Y para que conste, se extiende la presente acta.`
  },
  ampliatorio:{
    title:"Informe ampliatorio",
    fields:[
      ["referencia","Referencia / número de denuncia","text"],
      ["fecha","Fecha","date"],
      ["hora","Hora","time"],
      ["lugar","Lugar de los hechos","text"],
      ["agentes","Agentes actuantes / TIP","text"],
      ["asunto","Asunto","text"],
      ["antecedentes","Antecedentes","textarea","full"],
      ["actuaciones","Actuaciones realizadas","textarea","full"],
      ["resultado","Resultado y conclusión","textarea","full"]
    ],
    build:v=>`INFORME AMPLIATORIO

Referencia: ${v.referencia || "__________"}
Asunto: ${v.asunto || "__________"}
Fecha y hora: ${formatDate(v.fecha)}, ${v.hora || "____"} horas
Lugar: ${v.lugar || "__________"}
Agentes actuantes: ${v.agentes || "__________"}

ANTECEDENTES

${v.antecedentes || "________________________________________________________________"}

ACTUACIONES REALIZADAS

${v.actuaciones || "________________________________________________________________"}

RESULTADO Y CONCLUSIÓN

${v.resultado || "________________________________________________________________"}

Se emite el presente informe a los efectos oportunos.`
  },
  diligencia:{
    title:"Diligencia básica de tráfico",
    fields:[
      ["fecha","Fecha","date"],
      ["hora","Hora","time"],
      ["lugar","Lugar","text"],
      ["agentes","Agentes actuantes / TIP","text"],
      ["vehiculo","Vehículo y matrícula","text"],
      ["persona","Persona implicada","text"],
      ["motivo","Motivo de la actuación","text"],
      ["hechos","Hechos observados","textarea","full"],
      ["gestiones","Gestiones practicadas","textarea","full"],
      ["resultado","Resultado de la actuación","textarea","full"]
    ],
    build:v=>`DILIGENCIA DE ACTUACIÓN

En fecha ${formatDate(v.fecha)}, a las ${v.hora || "____"} horas, en ${v.lugar || "__________"}, los agentes actuantes ${v.agentes || "__________"} realizan actuación relacionada con:

Vehículo: ${v.vehiculo || "__________"}
Persona implicada: ${v.persona || "__________"}
Motivo: ${v.motivo || "__________"}

HECHOS OBSERVADOS

${v.hechos || "________________________________________________________________"}

GESTIONES PRACTICADAS

${v.gestiones || "________________________________________________________________"}

RESULTADO

${v.resultado || "________________________________________________________________"}

Y para que conste, se extiende la presente diligencia.`
  }
};

let currentDocumentType = null;

function formatDate(value){
  if(!value) return "____/____/________";
  const [year,month,day]=value.split("-");
  return `${day}/${month}/${year}`;
}

function openDocumentBuilder(type){
  const config=DOCUMENT_TYPES[type];
  if(!config) return;
  currentDocumentType=type;
  $("#documentTitle").textContent=config.title;
  const form=$("#documentForm");
  form.innerHTML="";
  config.fields.forEach(([name,label,type,className])=>{
    const wrapper=document.createElement("label");
    if(className) wrapper.className=className;
    wrapper.textContent=label;
    const field=type==="textarea" ? document.createElement("textarea") : document.createElement("input");
    field.name=name;
    if(type!=="textarea") field.type=type;
    if(type==="textarea") field.rows=4;
    wrapper.appendChild(field);
    form.appendChild(wrapper);
  });
  $("#documentOutput").value="";
  $("#documentDialog").showModal();
}

function collectDocumentValues(){
  const values={};
  document.querySelectorAll("#documentForm [name]").forEach(field=>values[field.name]=field.value.trim());
  return values;
}

function setupDocumentBuilder(){
  document.querySelectorAll("[data-document]").forEach(button=>{
    button.addEventListener("click",()=>openDocumentBuilder(button.dataset.document));
  });
  $("#documentCloseButton").addEventListener("click",()=>$("#documentDialog").close());
  $("#generateDocumentButton").addEventListener("click",()=>{
    if(!currentDocumentType) return;
    $("#documentOutput").value=DOCUMENT_TYPES[currentDocumentType].build(collectDocumentValues());
  });
  $("#copyDocumentButton").addEventListener("click",async()=>{
    if(!$("#documentOutput").value.trim() && currentDocumentType){
      $("#documentOutput").value=DOCUMENT_TYPES[currentDocumentType].build(collectDocumentValues());
    }
    await navigator.clipboard.writeText($("#documentOutput").value);
    alert("Documento copiado.");
  });
}


function sentenceCase(text){
  let value=String(text || "").trim().replace(/\s+/g," ");
  if(!value) return "";
  value=value.charAt(0).toUpperCase()+value.slice(1);
  if(!/[.!?]$/.test(value)) value+=".";
  return value;
}

function improveSpanishPoliceText(text, fieldName){
  let value=String(text || "").trim();
  if(!value) return "";

  const replacements=[
    [/\bq\b/gi,"que"],
    [/\biva\b/gi,"iba"],
    [/\bhiva\b/gi,"iba"],
    [/\bacer?a\b/gi,"acera"],
    [/\basfalto\b/gi,"asfalto"],
    [/\besta\b/gi,"está"],
    [/\bcaido\b/gi,"caído"],
    [/\bde repente por culpa de\b/gi,"de manera repentina, debido a"],
    [/\bpor culpa del\b/gi,"debido al"],
    [/\bpor culpa de la\b/gi,"debido a la"],
    [/\bse ha caído\b/gi,"cayó al suelo"],
    [/\bse cayó\b/gi,"cayó al suelo"],
    [/\biba corriendo por la acera y de repente\b/gi,"circulaba corriendo por la acera cuando, de manera repentina,"],
    [/\bque ella\b/gi,"Manifiesta que ella"],
    [/\bque él\b/gi,"Manifiesta que él"],
    [/\bque el asfalto se observa que\b/gi,"Se observa que el asfalto"],
    [/\bse observa que esta en mal estado\b/gi,"se encuentra en mal estado"],
    [/\bse observa que está en mal estado\b/gi,"se encuentra en mal estado"]
  ];
  replacements.forEach(([pattern,replacement])=>value=value.replace(pattern,replacement));

  value=value
    .replace(/\s+,/g,",")
    .replace(/,\s*,+/g,", ")
    .replace(/\s+\./g,".")
    .replace(/\s{2,}/g," ")
    .trim();

  if(fieldName==="hechos"){
    if(!/^Manifiesta que/i.test(value)){
      value="Manifiesta que "+value.charAt(0).toLowerCase()+value.slice(1);
    }
    value=value
      .replace(/Manifiesta que manifiesta que/gi,"Manifiesta que")
      .replace(/cuando, de manera repentina, debido/gi,"cuando, debido")
      .replace(/Manifiesta que ella se desplazaba corriendo por la acera y de forma repentina por culpa del asfalto sufrió una caída al suelo/gi,
        "Manifiesta que se desplazaba corriendo por la acera cuando, de forma repentina, sufrió una caída al suelo que atribuye al deficiente estado de conservación del pavimento");
  }

  if(fieldName==="observaciones"){
    value=value
      .replace(/^Que se observa /i,"")
      .replace(/^Se observa /i,"");
    if(!/^(Se hace constar|Asimismo)/i.test(value)){
      value="Se hace constar que, realizada una inspección visual del lugar, "+value.charAt(0).toLowerCase()+value.slice(1);
    }
  }

  return sentenceCase(value);
}

function improveCatalanPoliceText(text, fieldName){
  let value=String(text || "").trim();
  if(!value) return "";
  const replacements=[
    [/\bque ella\b/gi,"Manifesta que ella"],
    [/\bque ell\b/gi,"Manifesta que ell"],
    [/\biba\b/gi,"anava"],
    [/\bcorriendo\b/gi,"corrent"],
    [/\bacera\b/gi,"vorera"],
    [/\bde repente\b/gi,"de manera sobtada"],
    [/\bpor culpa del\b/gi,"a causa del"],
    [/\bpor culpa de la\b/gi,"a causa de la"],
    [/\basfalto\b/gi,"asfalt"],
    [/\bse ha caído\b/gi,"va caure a terra"],
    [/\besta en mal estado\b/gi,"es troba en mal estat"],
    [/\bestá en mal estado\b/gi,"es troba en mal estat"]
  ];
  replacements.forEach(([pattern,replacement])=>value=value.replace(pattern,replacement));
  value=value.replace(/\s+/g," ").trim();

  if(fieldName==="hechos" && !/^Manifesta que/i.test(value)){
    value="Manifesta que "+value.charAt(0).toLowerCase()+value.slice(1);
  }
  if(fieldName==="observaciones" && !/^(S'observa|Es fa constar|Així mateix)/i.test(value)){
    value="Es fa constar que "+value.charAt(0).toLowerCase()+value.slice(1);
  }
  return sentenceCase(value);
}

function detectDocumentLanguage(){
  const all=[...document.querySelectorAll("#documentForm textarea")].map(x=>normalize(x.value)).join(" ");
  const catalanWords=["que","vorera","asfalt","manifesta","troba","a causa","va caure"];
  const spanishWords=["ella","acera","asfalto","manifiesta","debido","cayó","iba"];
  const ca=catalanWords.reduce((n,w)=>n+(all.includes(normalize(w))?1:0),0);
  const es=spanishWords.reduce((n,w)=>n+(all.includes(normalize(w))?1:0),0);
  return ca>es ? "ca" : "es";
}

async function improveCurrentDocument(){
  if(!currentDocumentType){
    $("#documentAiStatus").textContent="Abre primero un documento.";
    return;
  }

  const button=$("#improveDocumentButton");
  const status=$("#documentAiStatus");
  button.classList.add("processing");
  status.textContent="Analizando y mejorando la redacción…";

  await new Promise(resolve=>setTimeout(resolve,450));

  const language=detectDocumentLanguage();
  let changed=0;
  document.querySelectorAll("#documentForm textarea").forEach(area=>{
    const original=area.value;
    const improved=language==="ca"
      ? improveCatalanPoliceText(original,area.name)
      : improveSpanishPoliceText(original,area.name);
    if(improved && improved!==original){
      area.value=improved;
      area.classList.add("ai-changed");
      setTimeout(()=>area.classList.remove("ai-changed"),1200);
      changed++;
    }
  });

  if(currentDocumentType && DOCUMENT_TYPES[currentDocumentType]){
    $("#documentOutput").value=DOCUMENT_TYPES[currentDocumentType].build(collectDocumentValues());
  }

  button.classList.remove("processing");
  status.textContent=changed
    ? `Texto corregido y adaptado a una redacción más técnica policial en ${changed} apartado${changed===1?"":"s"}. Revisa siempre el resultado antes de utilizarlo.`
    : "No se han detectado cambios necesarios.";
}

function setupDocumentAI(){
  $("#improveDocumentButton").addEventListener("click",improveCurrentDocument);
}

setup();
setupVoiceAndAI();
setupSideMenu();
setupSuite();
setupDocumentBuilder();
setupDocumentAI();
