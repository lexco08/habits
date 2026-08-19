let state;

const $ = (id) => document.getElementById(id);
const must = (id) => {
  const el = $(id);
  if(!el) throw new Error(`Falta #${id} en el HTML`);
  return el;
};

function catClass(cat){
  const c = (cat||"General").trim();
  const safe = c
    .replaceAll("á","a").replaceAll("é","e").replaceAll("í","i").replaceAll("ó","o").replaceAll("ú","u")
    .replaceAll(/[^a-zA-Z0-9]/g,"");
  return `cat-${safe || "General"}`;
}

function renderMonthLabel(){
  must("monthLabel").textContent = `${BGT.monthNameES(state.viewMonth)} ${state.viewYear}`;
}

function renderMiniStats(){
  const stats = BGT.monthStats(state, state.viewYear, state.viewMonth);
  const avg = Math.round(stats.avgPct * 100);
  must("miniStats").textContent =
    `Promedio: ${avg}% • Verde:${stats.counts.green} Amar:${stats.counts.yellow} Nar:${stats.counts.orange} Rojo:${stats.counts.red}`;
}

function renderCalendar(){
  const grid = must("calendarGrid");
  grid.innerHTML = "";

  const first = BGT.startOfMonth(state.viewYear, state.viewMonth);
  const leading = BGT.mondayIndex(first);
  const dim = BGT.daysInMonth(state.viewYear, state.viewMonth);

  for(let i=0;i<leading;i++){
    const cell = document.createElement("div");
    cell.className = "day mutedCell";
    grid.appendChild(cell);
  }

  const todayStr = BGT.toISODate(new Date());

  for(let day=1; day<=dim; day++){
    const iso = BGT.toISODate(new Date(state.viewYear, state.viewMonth, day));
    const { pct } = BGT.completionFor(state, iso);
    const tier = BGT.tierFromPct(pct);

    const cell = document.createElement("div");
    cell.className = "day";
    cell.style.background = BGT.tierColor(tier);

    if(iso === state.selected) cell.classList.add("selected");
    if(iso === todayStr) cell.classList.add("todayBadge");

    cell.innerHTML = `<div class="num">${day}</div><div class="pct">${Math.round(pct*100)}%</div>`;
    cell.addEventListener("click", () => {
      state.selected = iso;
      BGT.saveState(state);
      renderAll();
    });

    grid.appendChild(cell);
  }
}

function renderProgress(){
  const { done, total, pct } = BGT.completionFor(state, state.selected);
  must("progressFill").style.width = `${Math.round(pct*100)}%`;

  const tier = BGT.tierFromPct(pct);
  const tierTxt = BGT.tierLabel(tier);
  must("progressText").textContent = `${Math.round(pct*100)}% • ${done}/${total} • ${tierTxt}`;
}

function renderStreak(){
  const TH = 0.75;
  let streak = 0;
  let cursor = BGT.parseISODate(state.selected);
  while(true){
    const iso = BGT.toISODate(cursor);
    const { pct } = BGT.completionFor(state, iso);
    if(BGT.tierFromPct(pct) >= TH){
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }else break;
  }
  must("streakNum").textContent = String(streak);
}

function renderPoints(){
  const todayPts = BGT.pointsForDay(state, state.selected);
  must("todayPts").textContent = String(todayPts);

  const r = BGT.rewardsAvailable(state);
  must("rewardAvail").textContent = String(r.available);
}

function renderChecklist(){
  const ul = must("habitsList");
  ul.innerHTML = "";

  const entry = BGT.getEntry(state, state.selected);

  for(const h of state.habits){
    const li = document.createElement("li");
    li.className = "habitItem";

    const checked = !!entry.checks[h.id];
    const pts = (typeof h.points === "number" ? h.points : 1);

    li.innerHTML = `
      <div class="habitLeft">
        <input type="checkbox" ${checked ? "checked":""} />
        <div class="habitIcon">${h.icon || "✅"}</div>
        <div>
          <div class="habitName">${escapeHtml(h.name)}</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:4px;">
            <div class="badge ${catClass(h.category)}">🏷️ ${escapeHtml(h.category || "General")}</div>
            <div class="badge">⚡ +${pts} pts</div>
          </div>
        </div>
      </div>
    `;

    li.querySelector("input").addEventListener("change", (ev) => {
      entry.checks[h.id] = !!ev.target.checked;
      entry.updatedAt = Date.now();
      BGT.saveState(state);

      renderCalendar();
      renderMiniStats();
      renderProgress();
      renderStreak();
      renderPoints();
      setSavedPing();
    });

    ul.appendChild(li);
  }
}

function renderChallenge(){
  const entry = BGT.getEntry(state, state.selected);
  const dc = BGT.dailyChallengeFor(state.selected);

  must("challengeText").textContent = `${dc.title} (${dc.minutes} min)`;
  must("challengeDetail").textContent = dc.detail || "";
  must("challengeTag").textContent = `+${dc.points || 10} pts`;

  const chk = must("challengeCheck");
  chk.checked = !!entry.extras.dailyDone;

  chk.onchange = () => {
    entry.extras.dailyDone = !!chk.checked;
    entry.updatedAt = Date.now();
    BGT.saveState(state);
    renderPoints();
    setSavedPing();
  };
}

function renderMonthlyBonus(){
  const entry = BGT.getEntry(state, state.selected);
  const d = BGT.parseISODate(state.selected);
  const list = BGT.monthlyBonusesFor(d.getFullYear(), d.getMonth());

  const wrap = must("monthlyBonusWrap");
  wrap.innerHTML = "";

  list.forEach((b) => {
    const line = document.createElement("label");
    line.className = "checkboxLine";
    const done = !!entry.extras.monthlyDone[b.id];
    line.innerHTML = `
      <input type="checkbox" ${done ? "checked":""} />
      <span><b>${escapeHtml(b.title)}</b> <span class="muted tiny">(${escapeHtml(b.detail || "")})</span></span>
      <span class="smallTag" style="margin-left:auto;">+${b.points || 20}</span>
    `;

    line.querySelector("input").addEventListener("change", (ev) => {
      entry.extras.monthlyDone[b.id] = !!ev.target.checked;
      entry.updatedAt = Date.now();
      BGT.saveState(state);
      renderPoints();
      setSavedPing();
    });

    wrap.appendChild(line);
  });
}

function renderDayPanel(){
  const d = BGT.parseISODate(state.selected);
  must("dayTitle").textContent = `${d.getDate()} ${BGT.monthNameES(d.getMonth())} ${d.getFullYear()}`;

  const r = BGT.rewardsAvailable(state);
  must("dayMeta").textContent =
    `Fecha: ${state.selected} • Hábitos: ${state.habits.length} • Total puntos: ${r.total} • Recompensas disponibles: ${r.available}`;

  const entry = BGT.getEntry(state, state.selected);
  must("dayNote").value = entry.note || "";

  renderChecklist();
  renderChallenge();
  renderMonthlyBonus();

  renderProgress();
  renderStreak();
  renderPoints();
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

let noteTimer = null;
function setSavedPing(){
  const s = must("saveStatus");
  const t = new Date();
  s.textContent = `Guardado ✅ ${BGT.pad(t.getHours())}:${BGT.pad(t.getMinutes())}:${BGT.pad(t.getSeconds())}`;
}

function wireEvents(){
  must("prevMonth").addEventListener("click", () => {
    state.viewMonth--;
    if(state.viewMonth < 0){ state.viewMonth = 11; state.viewYear--; }
    BGT.saveState(state);
    renderAll();
  });

  must("nextMonth").addEventListener("click", () => {
    state.viewMonth++;
    if(state.viewMonth > 11){ state.viewMonth = 0; state.viewYear++; }
    BGT.saveState(state);
    renderAll();
  });

  must("todayBtn").addEventListener("click", () => {
    const t = new Date();
    state.viewYear = t.getFullYear();
    state.viewMonth = t.getMonth();
    state.selected = BGT.toISODate(t);
    BGT.saveState(state);
    renderAll();
  });

  must("checkAllBtn").addEventListener("click", () => {
    const e = BGT.getEntry(state, state.selected);
    for(const h of state.habits) e.checks[h.id] = true;
    e.updatedAt = Date.now();
    BGT.saveState(state);
    renderAll();
    setSavedPing();
  });

  must("uncheckAllBtn").addEventListener("click", () => {
    const e = BGT.getEntry(state, state.selected);
    e.checks = {};
    e.updatedAt = Date.now();
    BGT.saveState(state);
    renderAll();
    setSavedPing();
  });

  must("clearDayBtn").addEventListener("click", () => {
    const e = BGT.getEntry(state, state.selected);
    e.checks = {};
    e.note = "";
    e.extras.dailyDone = false;
    e.extras.monthlyDone = {};
    e.updatedAt = Date.now();
    BGT.saveState(state);
    renderAll();
    setSavedPing();
  });

  // nota autosave
  must("dayNote").addEventListener("input", () => {
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => {
      const e = BGT.getEntry(state, state.selected);
      e.note = must("dayNote").value;
      e.updatedAt = Date.now();
      BGT.saveState(state);
      setSavedPing();
    }, 250);
  });

  // export/import/reset
  must("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brain-gym-tracker-${BGT.toISODate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  must("importInput").addEventListener("change", async () => {
    const file = must("importInput").files?.[0];
    if(!file) return;
    try{
      const incoming = JSON.parse(await file.text());
      if(!incoming || !Array.isArray(incoming.habits) || typeof incoming.entries !== "object") throw new Error("JSON inválido");
      state = incoming;
      BGT.saveState(state);
      renderAll();
      setSavedPing();
    }catch(e){
      alert("No pude importar: " + e.message);
    }finally{
      must("importInput").value = "";
    }
  });

  must("resetBtn").addEventListener("click", () => {
    if(!confirm("¿Seguro? Borra TODO el historial de este navegador.")) return;
    localStorage.removeItem(BGT.STORAGE_KEY);
    state = BGT.loadState();
    renderAll();
  });
}

function renderAll(){
  renderMonthLabel();
  renderCalendar();
  renderMiniStats();
  renderDayPanel();
}

window.addEventListener("DOMContentLoaded", () => {
  state = BGT.loadState();
  BGT.saveState(state);
  wireEvents();
  renderAll();
});
