let state;

const $ = (id) => document.getElementById(id);
const must = (id) => {
  const el = $(id);
  if(!el) throw new Error(`Falta #${id} en el HTML`);
  return el;
};

function setSavedPing(){
  const s = must("rtStatus");
  const t = new Date();
  s.textContent = `Guardado ✅ ${BGT.pad(t.getHours())}:${BGT.pad(t.getMinutes())}:${BGT.pad(t.getSeconds())}`;
}

function withinISO(dateStr, startISO, endISOInclusive){
  return dateStr >= startISO && dateStr <= endISOInclusive;
}

function baseTemplateFor(dateStr){
  const y = dateStr.slice(0,4);
  const hasCourse = withinISO(dateStr, `${y}-01-12`, `${y}-01-16`);

  return [
    "OBJETIVO DEL DÍA: 1% mejor (sin excusas).",
    "REGLAS CLAVE:",
    "- No teléfono hasta 08:00 (o al terminar rutina AM).",
    "- Música SOLO en caminar/gym/limpieza. En matemáticas/NN: NO.",
    "- 1 bloque profundo sin celular (2h).",
    "",
    "RUTINA (edítala a tu vida real):",
    "06:30  Despertar → agua → 3 min respiración",
    "06:40  Aseo rápido + cama + ordenar 5 min",
    "07:00  Desayuno (leche + Cheerios + huevo)",
    "07:30  Inglés (gramática básica) 20–30 min",
    hasCourse ? "09:00–11:00  Curso prototipos (12–16 enero)" : "09:00–10:30  Matemáticas (fundamentos)",
    hasCourse ? "11:15–12:15  Matemáticas (fundamentos)" : "10:45–12:00  Redes neuronales (fundamentos)",
    "12:15  10 min caminar sin música (solo observar)",
    "13:00  Comida (pollo + carb limpio + verduras)",
    "14:00–15:30  Programar proyecto (deep work)",
    "15:30  Snack (yogurt/leche + fruta) + agua",
    "16:30–18:45  Gym (2h aprox)",
    "19:15  Cena (pollo/huevo + verduras)",
    "20:00  Redacción (10 min): 1 tip + 1 párrafo",
    "20:30  Diario: ¿qué hice? ¿qué falló? ¿qué mejoro mañana?",
    "21:30  Lectura 20 min",
    "22:30  Dormir (pantallas fuera 45 min antes)",
    "",
    "CHECK FINAL (30s): 1) ¿Qué hice bien? 2) ¿Qué me saboteó? 3) ¿Qué haré mañana sí o sí?",
  ].join("\\n");
}

let saveTimer = null;
function scheduleSave(){
  if(saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const iso = must("datePick").value;
    if(!iso) return;

    const entry = BGT.getEntry(state, iso);
    entry.extras.routineText = must("routineText").value || "";
    entry.extras.rulesText = must("rulesText").value || "";
    entry.extras.mealsText = must("mealsText").value || "";
    entry.updatedAt = Date.now();

    state.selected = iso;
    state.viewYear = Number(iso.slice(0,4));
    state.viewMonth = Number(iso.slice(5,7)) - 1;

    BGT.saveState(state);
    renderKPIs(iso);
    setSavedPing();
  }, 250);
}

function renderKPIs(iso){
  const { pct } = BGT.completionFor(state, iso);
  const tier = BGT.tierFromPct(pct);
  must("rtTier").textContent = `${BGT.tierLabel(tier)} • ${Math.round(pct*100)}%`;

  const pts = BGT.pointsForDay(state, iso);
  must("rtPoints").textContent = String(pts);

  const r = BGT.rewardsAvailable(state);
  must("rtRewards").textContent = String(r.available);
}

function loadForDate(iso){
  state.selected = iso;
  const entry = BGT.getEntry(state, iso);

  must("datePick").value = iso;
  must("routineText").value = entry.extras.routineText || "";
  must("rulesText").value = entry.extras.rulesText || "";
  must("mealsText").value = entry.extras.mealsText || "";

  renderKPIs(iso);
}

function shiftDay(delta){
  const d = BGT.parseISODate(must("datePick").value || state.selected);
  d.setDate(d.getDate() + delta);
  const iso = BGT.toISODate(d);
  loadForDate(iso);
  BGT.saveState(state);
  setSavedPing();
}

function wire(){
  must("datePick").addEventListener("change", () => {
    const iso = must("datePick").value;
    if(!iso) return;
    loadForDate(iso);
    BGT.saveState(state);
    setSavedPing();
  });

  must("prevDay").addEventListener("click", () => shiftDay(-1));
  must("nextDay").addEventListener("click", () => shiftDay(1));

  ["routineText","rulesText","mealsText"].forEach(id => {
    must(id).addEventListener("input", scheduleSave);
  });

  must("applyTemplate").addEventListener("click", () => {
    const iso = must("datePick").value;
    if(!iso) return;
    const ta = must("routineText");
    const tpl = baseTemplateFor(iso);
    if(ta.value.trim()){
      const ok = confirm("Ya hay texto. ¿Reemplazarlo por la plantilla base?");
      if(!ok) return;
    }
    ta.value = tpl;
    scheduleSave();
  });

  must("clearRoutine").addEventListener("click", () => {
    const ok = confirm("¿Limpiar rutina/reglas/comidas de este día?");
    if(!ok) return;
    must("routineText").value = "";
    must("rulesText").value = "";
    must("mealsText").value = "";
    scheduleSave();
  });
}

function init(){
  state = BGT.loadState();
  wire();
  loadForDate(state.selected || BGT.toISODate(new Date()));
}

init();
