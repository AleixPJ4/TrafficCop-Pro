
const DATA = [{"id": "demo-mobile", "norma": "DEMO", "articulo": "00.0", "opcion": "A", "titulo": "Uso del teléfono móvil durante la conducción", "descripcion": "Ficha demostrativa para comprobar que el buscador funciona.", "importe": 0, "puntos": 0, "responsable": "Conductor", "calificacion": "DEMO", "observaciones": "No utilizar para formular denuncias reales.", "palabras": ["móvil", "movil", "teléfono", "telefono", "distracción"]}, {"id": "demo-itv", "norma": "DEMO", "articulo": "00.0", "opcion": "B", "titulo": "Inspección técnica del vehículo", "descripcion": "Ficha demostrativa para búsquedas relacionadas con ITV.", "importe": 0, "puntos": 0, "responsable": "Titular", "calificacion": "DEMO", "observaciones": "No utilizar para formular denuncias reales.", "palabras": ["itv", "inspección", "inspeccion", "caducada", "desfavorable"]}, {"id": "demo-matricula", "norma": "DEMO", "articulo": "00.0", "opcion": "C", "titulo": "Placas de matrícula", "descripcion": "Ficha demostrativa para búsquedas relacionadas con matrículas.", "importe": 0, "puntos": 0, "responsable": "Conductor o titular", "calificacion": "DEMO", "observaciones": "No utilizar para formular denuncias reales.", "palabras": ["matrícula", "matricula", "placa", "ilegible", "manipulada"]}, {"id": "demo-vmp", "norma": "DEMO", "articulo": "00.0", "opcion": "D", "titulo": "Vehículo de movilidad personal", "descripcion": "Ficha demostrativa para búsquedas relacionadas con VMP.", "importe": 0, "puntos": 0, "responsable": "Conductor", "calificacion": "DEMO", "observaciones": "No utilizar para formular denuncias reales.", "palabras": ["vmp", "patinete", "casco", "acera"]}];
const fav = new Set(JSON.parse(localStorage.getItem("tcp-v05-fav") || "[]"));
let view = "all";
const $ = s => document.querySelector(s);

function normal(s){
  return String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
}

function render(){
  const query = normal($("#q").value);
  let items = DATA.filter(x => normal([x.titulo,x.descripcion,x.norma,x.articulo,x.opcion,...x.palabras].join(" ")).includes(query));
  if(view === "fav") items = items.filter(x => fav.has(x.id));
  $("#count").textContent = `${items.length} resultado${items.length===1?"":"s"}`;
  const box = $("#results");
  box.innerHTML = "";
  if(!items.length){
    box.innerHTML = '<div class="empty">No se han encontrado coincidencias.</div>';
    return;
  }
  items.forEach(x => {
    const f = $("#tpl").content.cloneNode(true);
    f.querySelector("h3").textContent = x.titulo;
    f.querySelector(".desc").textContent = x.descripcion;
    f.querySelector(".art").textContent = x.articulo;
    f.querySelector(".opt").textContent = x.opcion;
    f.querySelector(".amount").textContent = x.importe + " €";
    f.querySelector(".pts").textContent = x.puntos;
    f.querySelector(".resp").textContent = x.responsable;
    f.querySelector(".grade").textContent = x.calificacion;
    f.querySelector(".notes").textContent = x.observaciones;
    const star = f.querySelector(".star");
    star.textContent = fav.has(x.id) ? "★" : "☆";
    star.onclick = () => {
      fav.has(x.id) ? fav.delete(x.id) : fav.add(x.id);
      localStorage.setItem("tcp-v05-fav",JSON.stringify([...fav]));
      render();
    };
    f.querySelector(".copy").onclick = async () => {
      await navigator.clipboard.writeText(`${x.titulo}\nArt. ${x.articulo} · Opción ${x.opcion}\n${x.descripcion}`);
      alert("Concepto copiado.");
    };
    box.appendChild(f);
  });
}

$("#q").addEventListener("input",render);
document.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { $("#q").value=b.dataset.q; render(); });
document.querySelectorAll("[data-view]").forEach(b => b.onclick = () => {
  view=b.dataset.view;
  document.querySelectorAll("[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
  render();
});
$("#theme").onclick = () => document.documentElement.classList.toggle("dark");
$("#install").onclick = () => alert("iPhone: Safari → Compartir → Añadir a pantalla de inicio.\nAndroid: Chrome → menú → Instalar aplicación.");
render();
