
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

setup();
setupVoiceAndAI();
