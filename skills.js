let state;

const $ = (id) => document.getElementById(id);
const must = (id) => {
  const el = $(id);
  if(!el) throw new Error(`Falta #${id}`);
  return el;
};

function setSaved(){
  const t = new Date();
  must("skStatus").textContent = `Guardado ✅ ${BGT.pad(t.getHours())}:${BGT.pad(t.getMinutes())}:${BGT.pad(t.getSeconds())}`;
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function render(dateStr){
  const entry = BGT.getEntry(state, dateStr);
  must("datePick").value = dateStr;

  const wrap = must("skillsList");
  wrap.innerHTML = "";

  let dayPts = 0;

  (state.skills || []).forEach((sk) => {
    const card = document.createElement("div");
    card.className = "boardCard";

    const done = !!(entry.extras.skillDone && entry.extras.skillDone[sk.id]);
    const pts = sk.points || 3;
    if(done) dayPts += pts;

    card.innerHTML = `
      <div class="challengeRow">
        <h3 style="margin:0; display:flex; align-items:center; gap:8px;">
          <span style="font-size:20px;">${sk.icon || "🧩"}</span>
          <span>${escapeHtml(sk.name)}</span>
        </h3>
        <span class="smallTag">+${pts} pts</span>
      </div>

      <label class="checkboxLine">
        <input type="checkbox" ${done ? "checked":""} />
        <span>Practicado hoy</span>
      </label>

      <div class="muted tiny" style="margin-top:8px;">Tips:</div>
      <ul class="boardList">
        ${(sk.tips || []).slice(0,3).map(t => `<li>${escapeHtml(t)}</li>`).join("")}
      </ul>
    `;

    card.querySelector("input").addEventListener("change", (ev) => {
      entry.extras.skillDone[sk.id] = !!ev.target.checked;
      entry.updatedAt = Date.now();
      BGT.saveState(state);
      render(dateStr);
      setSaved();
    });

    wrap.appendChild(card);
  });

  must("skPoints").textContent = `+${dayPts} pts`;
}

window.addEventListener("DOMContentLoaded", () => {
  state = BGT.loadState();
  const dateStr = state.selected || BGT.toISODate(new Date());
  render(dateStr);

  must("datePick").addEventListener("change", () => {
    const d = must("datePick").value;
    state.selected = d;
    BGT.saveState(state);
    render(d);
  });
});
