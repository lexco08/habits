let state;

const $ = (id) => document.getElementById(id);
const must = (id) => {
  const el = $(id);
  if(!el) throw new Error(`Falta #${id}`);
  return el;
};

let tmr = null;

function setSaved(){
  const t = new Date();
  must("sStatus").textContent = `Guardado ✅ ${BGT.pad(t.getHours())}:${BGT.pad(t.getMinutes())}:${BGT.pad(t.getSeconds())}`;
}

function autosaveSoon(){
  clearTimeout(tmr);
  tmr = setTimeout(() => {
    BGT.saveState(state);
    setSaved();
  }, 250);
}

function render(){
  const ul = must("list");
  ul.innerHTML = "";

  state.habits.forEach((h, idx) => {
    const li = document.createElement("li");
    li.className = "habitItem";
    li.innerHTML = `
      <div style="display:flex; gap:10px; width:100%; align-items:flex-start;">
        <div style="width:28px; text-align:center; color:rgba(255,255,255,0.55); font-weight:950; padding-top:8px;">
          ${idx+1}
        </div>

        <div style="flex:1;">
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <input class="btn ghost" style="width:90px; text-align:center;" data-k="icon" data-id="${h.id}" value="${escapeHtml(h.icon||"✅")}" maxlength="3" />
            <input class="btn ghost" style="flex:1;" data-k="name" data-id="${h.id}" value="${escapeHtml(h.name)}" maxlength="70" />
            <input class="btn ghost" style="width:180px;" data-k="category" data-id="${h.id}" value="${escapeHtml(h.category||"General")}" maxlength="20" />
            <input class="btn ghost" style="width:120px;" data-k="points" data-id="${h.id}" type="number" min="0" step="1" value="${Number.isFinite(h.points) ? h.points : 1}" />
          </div>
          <div class="muted tiny" style="margin-top:6px;">Puntos = gamificación (NO cambia el color del calendario).</div>
        </div>

        <div style="display:flex; gap:8px; padding-top:4px;">
          <button class="btn ghost" data-act="up" data-id="${h.id}">⬆️</button>
          <button class="btn ghost" data-act="down" data-id="${h.id}">⬇️</button>
          <button class="btn danger ghost" data-act="del" data-id="${h.id}">🗑️</button>
        </div>
      </div>
    `;
    ul.appendChild(li);
  });

  // Rewards UI
  must("rewardName").value = state.gamify?.rewardName || "Hamburguesa 🍔";
  must("pointsPerReward").value = String(state.gamify?.pointsPerReward ?? 200);
  const r = BGT.rewardsAvailable(state);
  must("rewardMeta").textContent = `Total puntos: ${r.total} • Ganadas: ${r.earned} • Canjeadas: ${r.redeemed} • Disponibles: ${r.available} (cada ${r.cost})`;
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function wire(){
  must("list").addEventListener("input", (e) => {
    const el = e.target;
    const id = el.getAttribute("data-id");
    const k = el.getAttribute("data-k");
    if(!id || !k) return;

    const h = state.habits.find(x => x.id === id);
    if(!h) return;

    if(k === "points"){
      const v = Number(el.value);
      h.points = Number.isFinite(v) ? v : 1;
    }else{
      h[k] = (el.value || "").trim();
    }
    autosaveSoon();
  });

  must("list").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act]");
    if(!btn) return;
    const act = btn.getAttribute("data-act");
    const id = btn.getAttribute("data-id");
    const i = state.habits.findIndex(x => x.id === id);
    if(i < 0) return;

    if(act === "del"){
      state.habits.splice(i, 1);
      for(const date of Object.keys(state.entries)){
        if(state.entries[date]?.checks) delete state.entries[date].checks[id];
      }
      render(); autosaveSoon(); return;
    }
    if(act === "up" && i > 0){
      [state.habits[i-1], state.habits[i]] = [state.habits[i], state.habits[i-1]];
      render(); autosaveSoon(); return;
    }
    if(act === "down" && i < state.habits.length - 1){
      [state.habits[i+1], state.habits[i]] = [state.habits[i], state.habits[i+1]];
      render(); autosaveSoon(); return;
    }
  });

  must("addForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const icon = (must("newIcon").value || "✅").trim();
    const name = (must("newName").value || "").trim();
    const cat = (must("newCat").value || "General").trim();
    if(!name) return;

    state.habits.push({ id: BGT.uid(), icon, name, category: cat, points: 1 });
    must("newIcon").value = "";
    must("newName").value = "";
    must("newCat").value = "";
    render(); autosaveSoon();
  });

  must("defaultsBtn").addEventListener("click", () => {
    if(!confirm("¿Restaurar hábitos por defecto? (No borra notas/diario)")) return;
    state.habits = BGT.DEFAULT_HABITS_V4.map(h => ({ id: BGT.uid(), ...h }));
    render(); autosaveSoon();
  });

  must("saveRewards").addEventListener("click", () => {
    const rn = (must("rewardName").value || "Hamburguesa 🍔").trim();
    const pr = Number(must("pointsPerReward").value);
    if(!state.gamify) state.gamify = {};
    state.gamify.rewardName = rn;
    state.gamify.pointsPerReward = Number.isFinite(pr) ? pr : 200;
    BGT.saveState(state);
    setSaved();
    alert("Recompensas guardadas ✅");
    render();
  });

  must("redeemOne").addEventListener("click", () => {
    const r = BGT.rewardsAvailable(state);
    if(r.available <= 0){
      alert("Aún no tienes recompensas disponibles.");
      return;
    }
    if(!confirm(`¿Canjear 1 recompensa (${state.gamify?.rewardName || "Recompensa"})?`)) return;
    if(!state.gamify) state.gamify = {};
    if(!Array.isArray(state.gamify.redeemed)) state.gamify.redeemed = [];
    state.gamify.redeemed.push({ at: Date.now(), name: state.gamify.rewardName || "Recompensa" });
    BGT.saveState(state);
    setSaved();
    render();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  state = BGT.loadState();
  BGT.saveState(state);
  render();
  wire();
});
