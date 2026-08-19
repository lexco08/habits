let state;

const $ = (id) => document.getElementById(id);
const must = (id) => {
  const el = $(id);
  if(!el) throw new Error(`Falta #${id}`);
  return el;
};

let timer = null;

function setStatusSaved(){
  const t = new Date();
  must("jStatus").textContent = `Guardado ✅ ${BGT.pad(t.getHours())}:${BGT.pad(t.getMinutes())}:${BGT.pad(t.getSeconds())}`;
}

function loadEntryToUI(dateStr){
  must("datePick").value = dateStr;
  const e = BGT.getEntry(state, dateStr);
  must("journalText").value = e.journal || "";
}

function saveJournal(dateStr){
  const e = BGT.getEntry(state, dateStr);
  e.journal = must("journalText").value;
  e.updatedAt = Date.now();
  BGT.saveState(state);
  setStatusSaved();
}

function makeMonthlySummary(y,m){
  const stats = BGT.monthStats(state, y, m);
  const avgPct = Math.round(stats.avgPct * 100);
  const score = stats.avgTier.toFixed(2);

  const worst = stats.worstHabits
    .map(h => `- ${h.icon || "✅"} ${h.name} (falló ${h.miss}/${stats.dim} días)`)
    .join("\n");

  let vibe = "ANTI-VISION (ROJO)";
  if(stats.avgTier >= 0.75) vibe = "VISION (AMARILLO/VERDE)";
  else if(stats.avgTier >= 0.50) vibe = "ZONA PELIGRO (NARANJA)";

  return `
RESUMEN — ${BGT.monthNameES(m)} ${y}
----------------------------------
Promedio real del mes: ${avgPct}%
Score por tiers (0/0.5/0.75/1): ${score}  →  ${vibe}

Días por color:
- Verde (100%): ${stats.counts.green}
- Amarillo (≥75%): ${stats.counts.yellow}
- Naranja (≥50%): ${stats.counts.orange}
- Rojo (<50%): ${stats.counts.red}

Mejor racha (≥75%): ${stats.bestStreak} días

Top 5 hábitos que MÁS te tumbaron:
${worst}

Plan mínimo para subir de tier:
- Si estás en rojo: sube a naranja (≥50%) haciendo SOLO lo básico: gym + matem + programación + no tiktok.
- Si estás en naranja: sube a amarillo (≥75%) agregando redacción + inglés + dormir bien.
- Si estás en amarillo: busca días verdes (100%) 2–3 veces por semana.
`.trim();
}

function renderMonthSummary(){
  const y = state.viewYear, m = state.viewMonth;
  must("monthLabel2").textContent = `${BGT.monthNameES(m)} ${y} (según tu calendario)`;
  must("summaryBox").textContent = makeMonthlySummary(y,m);
}

function wire(){
  must("datePick").addEventListener("change", () => {
    const dateStr = must("datePick").value;
    state.selected = dateStr;
    BGT.saveState(state);
    loadEntryToUI(dateStr);
  });

  must("journalText").addEventListener("input", () => {
    clearTimeout(timer);
    const dateStr = must("datePick").value || state.selected;
    timer = setTimeout(() => saveJournal(dateStr), 250);
  });

  must("copySummary").addEventListener("click", async () => {
    try{
      await navigator.clipboard.writeText(must("summaryBox").textContent);
      must("copySummary").textContent = "✅ Copiado";
      setTimeout(() => must("copySummary").textContent = "📋 Copiar", 900);
    }catch{
      alert("No pude copiar. Selecciona el texto y copia manual.");
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  state = BGT.loadState();
  const dateStr = state.selected || BGT.toISODate(new Date());
  loadEntryToUI(dateStr);
  renderMonthSummary();
  wire();
});
