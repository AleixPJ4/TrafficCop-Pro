
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
Font: SCT maig 2026, pàgina ${item.pagina}`;
}

setup();
