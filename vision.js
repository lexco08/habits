let state = null;
let board = null;

const $ = (id) => document.getElementById(id);
const must = (id) => {
  const el = $(id);
  if(!el) throw new Error(`Falta #${id}`);
  return el;
};

function renderScore(){
  const y = state.viewYear, m = state.viewMonth;
  const stats = BGT.monthStats(state, y, m);

  // Score para el medidor = avgTier (0..1 aprox)
  const score = stats.avgTier; // promedio de tiers (0/0.5/0.75/1)
  const leftPct = Math.round(score * 100);
  must("needle").style.left = `${leftPct}%`;

  must("monthInfo").textContent = `${BGT.monthNameES(m)} ${y} • score(tier): ${score.toFixed(2)}`;
  must("avgPct").textContent = `${Math.round(stats.avgPct*100)}%`;
  must("tierMix").textContent = `${stats.counts.green}/${stats.counts.yellow}/${stats.counts.orange}/${stats.counts.red}`;
  must("bestStreak").textContent = `${stats.bestStreak} días`;

  // Badge según score
  let label = "ROJO";
  if(score >= 0.75) label = "VISION (AMARILLO/VERDE)";
  else if(score >= 0.50) label = "ZONA PELIGRO (NARANJA)";
  else label = "ANTI-VISION (ROJO)";

  must("scoreBadge").textContent = label;
}

function renderLists(){
  const v = must("visionList");
  const a = must("antiList");
  v.innerHTML = "";
  a.innerHTML = "";

  board.vision.forEach((item, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `${escapeHtml(item)} <button class="btn ghost" data-type="v" data-i="${idx}" style="padding:6px 10px; margin-left:8px;">🗑️</button>`;
    v.appendChild(li);
  });
  board.anti.forEach((item, idx) => {
    const li = document.createElement("li");
    li.innerHTML = `${escapeHtml(item)} <button class="btn ghost" data-type="a" data-i="${idx}" style="padding:6px 10px; margin-left:8px;">🗑️</button>`;
    a.appendChild(li);
  });
}

function save(){
  BGT.saveBoard(board);
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
  must("addVision").addEventListener("click", () => {
    const lines = (must("visionInput").value || "").split("\n").map(s=>s.trim()).filter(Boolean);
    if(!lines.length) return;
    board.vision.push(...lines);
    must("visionInput").value = "";
    save(); renderLists();
  });

  must("addAnti").addEventListener("click", () => {
    const lines = (must("antiInput").value || "").split("\n").map(s=>s.trim()).filter(Boolean);
    if(!lines.length) return;
    board.anti.push(...lines);
    must("antiInput").value = "";
    save(); renderLists();
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-type]");
    if(!btn) return;
    const type = btn.getAttribute("data-type");
    const i = Number(btn.getAttribute("data-i"));
    if(type === "v") board.vision.splice(i, 1);
    if(type === "a") board.anti.splice(i, 1);
    save(); renderLists();
  });

  must("resetBoard").addEventListener("click", () => {
    if(!confirm("¿Restaurar Vision/Anti-Vision por defecto?")) return;
    localStorage.removeItem(BGT.BOARD_KEY);
    board = BGT.loadBoard();
    renderLists();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  state = BGT.loadState();
  board = BGT.loadBoard();
  renderScore();
  renderLists();
  wire();
});
