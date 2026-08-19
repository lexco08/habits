// core.js — Brain Gym Tracker v4 (shared)
// Mantengo la misma key v2 para NO romper tu data actual:
const STORAGE_KEY = "brainGymTracker_v2";
const BOARD_KEY = "brainGymTracker_v2_board";

function uid() {
  return "h_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function pad(n){ return String(n).toString().padStart(2,"0"); }
function toISODate(d){
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function parseISODate(s){ return new Date(`${s}T00:00:00`); }
function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }
function startOfMonth(y,m){ return new Date(y, m, 1); }
function mondayIndex(date){
  const sunday0 = date.getDay(); // 0=Dom
  return (sunday0 + 6) % 7; // Lunes=0
}
function monthNameES(m){
  return ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][m] || "";
}
function safeParseJSON(raw, fallback){
  try{ return JSON.parse(raw); } catch { return fallback; }
}

const DEFAULT_HABITS_V4 = [
  // Salud
  { icon:"🏋️", name:"Gym / Entrenamiento (45–90 min)", category:"Salud", points:5 },
  { icon:"🚶", name:"Caminar 8k–10k pasos", category:"Salud", points:3 },
  { icon:"🥗", name:"Comida limpia / déficit calórico", category:"Salud", points:4 },
  { icon:"💧", name:"Agua 2L", category:"Salud", points:2 },
  { icon:"⏰", name:"Despertarse antes de las 8:00 am", category:"Salud", points:4 },

  // Estudio/Proyecto
  { icon:"📚", name:"Matemáticas (60 min) — active recall", category:"Estudio", points:5 },
  { icon:"🧠", name:"Redes neuronales (60 min)", category:"Estudio", points:5 },
  { icon:"💻", name:"Programar proyecto (90 min)", category:"Proyecto", points:6 },
  { icon:"✍️", name:"Redacción / Informe (30 min)", category:"Estudio", points:3 },
  { icon:"🗣️", name:"Inglés (20 min)", category:"Estudio", points:2 },
  { icon:"📖", name:"Leer (20 min)", category:"Mente", points:2 },

  // Mente/Disciplina
  { icon:"🧘", name:"Meditación (10 min)", category:"Mente", points:3 },
  { icon:"🧹", name:"Ordenar espacio (5 min)", category:"Disciplina", points:1 },
  { icon:"⏱️", name:"1 bloque sin celular (2h)", category:"Disciplina", points:4 },

  // Control (NO X)
  { icon:"🚫", name:"NO TikTok (0 min)", category:"Control", points:4 },
  { icon:"🚫", name:"NO P", category:"Control", points:6 },
  { icon:"🚽", name:"No usar el teléfono en el baño", category:"Control", points:2 },
  { icon:"🍬", name:"Cero refresco / azúcar líquida", category:"Control", points:2 },
];

const DEFAULT_SKILLS_V4 = [
  { icon:"🤝", name:"Socializar (1 interacción intencional)", tips:[
    "Habla 30s más de lo necesario (sin pena).",
    "Haz 1 pregunta buena: ‘¿Qué te emocionó hoy?’",
    "Da 1 cumplido específico (no genérico)."
  ], points:5 },
  { icon:"✍️", name:"Mejorar letra (10 min)", tips:[
    "Escribe lento, presión ligera.",
    "Copia un párrafo ‘bonito’ en mayúsculas y minúsculas.",
    "Usa hojas con renglón y mantén alturas."
  ], points:3 },
  { icon:"🧮", name:"Cálculo mental (10 min)", tips:[
    "Multiplica por 11, 9, 12, 25.",
    "Suma rápido en bloques (100s).",
    "Cronometra 5 min y anota récord."
  ], points:3 },
  { icon:"⌨️", name:"Mecanografía (10 min)", tips:[
    "Practica home row (asdf jkl;).",
    "Sin mirar teclado.",
    "Baja velocidad si sube precisión."
  ], points:2 },
];

const DAILY_CHALLENGES = [
  { id:"left_teeth", title:"Cepíllate los dientes con la mano izquierda", minutes:2, points:10, detail:"Control fino + incomodidad útil." },
  { id:"left_mouse", title:"Usa mouse/trackpad con mano izquierda", minutes:20, points:10, detail:"Reprograma hábitos y atención." },
  { id:"no_music_walk", title:"Camina 10 min sin música (solo observando)", minutes:10, points:10, detail:"Entrenas atención y presencia." },
  { id:"wall_ball", title:"Reacción: pelota a la pared (mano alternada)", minutes:5, points:10, detail:"Lanza y atrapa alternando manos." },
  { id:"breath_box", title:"Respiración caja 4-4-4-4", minutes:4, points:10, detail:"Calma + foco (4 ciclos)."},
  { id:"memory_20", title:"Memoria: memoriza 20 palabras / 10 pares", minutes:10, points:10, detail:"Anota, tapa, recuerda." },
  { id:"math_sprint", title:"Sprint mental: 20 operaciones en 5 min", minutes:5, points:10, detail:"Cronometra y mejora récord." },
  { id:"cold_finish", title:"Ducha: termina con agua fresca", minutes:1, points:10, detail:"Solo 15–30s. Si te mareas, NO." },
  { id:"posture", title:"Postura: 20 min ‘columna larga’", minutes:20, points:10, detail:"Hombros atrás, mandíbula relajada." },
  { id:"one_pitch", title:"Habla: explica tu proyecto en 60s", minutes:3, points:10, detail:"Grábate o dilo a alguien." },
];

const MONTHLY_BONUS_BY_MONTH = {
  0: [
    { id:"jan_sleep", title:"Dormir y despertar a la MISMA hora", points:20, detail:"Horario fijo (mínimo 5/7 días)." },
    { id:"jan_walk_after", title:"Caminata 10 min después de comer", points:20, detail:"Al menos 5 días." },
  ],
  1: [
    { id:"feb_clean", title:"Cero cuarto desordenado (5 min diarios)", points:20, detail:"Micro-limpieza diaria." },
    { id:"feb_write", title:"Escribir 1 página semanal (ensayo/bitácora)", points:20, detail:"Domingo: 1 página." },
  ],
  2: [
    { id:"mar_read", title:"Leer 12 páginas/día", points:20, detail:"Libro físico o Kindle." },
    { id:"mar_no_bathphone", title:"Cero teléfono en baño (todo el mes)", points:20, detail:"Sí cuenta." },
  ],
  3: [
    { id:"apr_stairs", title:"Subir escaleras (mín. 5 pisos) 3x/sem", points:20, detail:"Condición." },
    { id:"apr_english", title:"Inglés diario 10 min (sin fallar)", points:20, detail:"Racha." },
  ],
  4: [
    { id:"may_code", title:"1 mini-proyecto semanal (pequeño)", points:20, detail:"Algo deployable." },
    { id:"may_food", title:"Sin refresco todo el mes", points:20, detail:"Agua / té." },
  ],
  5: [
    { id:"jun_social", title:"Hablar con 1 persona nueva por semana", points:20, detail:"Con intención." },
    { id:"jun_study", title:"Repaso espaciado 3x/sem (flashcards)", points:20, detail:"20 min." },
  ],
  6: [
    { id:"jul_run", title:"Cardio 2x/sem (20 min)", points:20, detail:"Correr/bici/HIIT suave." },
    { id:"jul_write", title:"Escribir resumen de cada día (3 líneas)", points:20, detail:"Diario." },
  ],
  7: [
    { id:"aug_focus", title:"Bloque profundo diario 60 min (sin celular)", points:20, detail:"Sí o sí." },
    { id:"aug_protein", title:"Proteína en cada comida", points:20, detail:"Nutrición." },
  ],
  8: [
    { id:"sep_math", title:"Resolver 1 problema ‘cabron’ cada día", points:20, detail:"Aunque tardes." },
    { id:"sep_steps", title:"10k pasos 4x/sem", points:20, detail:"Constante." },
  ],
  9: [
    { id:"oct_speaking", title:"Practicar exposición 2x/sem (5 min)", points:20, detail:"Frente a espejo/cámara." },
    { id:"oct_sleep", title:"Apagar pantallas 45 min antes de dormir", points:20, detail:"Higiene de sueño." },
  ],
  10: [
    { id:"nov_gratitude", title:"Gratitud: 3 líneas al día", points:20, detail:"Reenfoca." },
    { id:"nov_cook", title:"Cocinar 2 platillos sanos/semana", points:20, detail:"Aprende 2 recetas." },
  ],
  11: [
    { id:"dec_review", title:"Revisión semanal (30 min) cada domingo", points:20, detail:"Plan + ajuste." },
    { id:"dec_novelty", title:"Aprender 1 cosa nueva semanal (micro)", points:20, detail:"Neuroplasticidad." },
  ],
};

function guessIcon(h){
  const n = (h.name||"").toLowerCase();
  const c = (h.category||"").toLowerCase();
  if(h.icon) return h.icon;
  if(n.includes("gym") || n.includes("entren")) return "🏋️";
  if(n.includes("caminar") || n.includes("pasos")) return "🚶";
  if(n.includes("déficit") || n.includes("comer") || n.includes("comida")) return "🥗";
  if(n.includes("agua")) return "💧";
  if(n.includes("dorm")) return "💤";
  if(n.includes("matem")) return "📚";
  if(n.includes("neur") || n.includes("redes")) return "🧠";
  if(n.includes("program")) return "💻";
  if(n.includes("redacc") || n.includes("informe")) return "✍️";
  if(n.includes("ingl")) return "🗣️";
  if(n.includes("leer")) return "📖";
  if(n.includes("medit")) return "🧘";
  if(n.includes("tiktok") || n.includes("porno") || n.includes("mastur")) return "🚫";
  if(c.includes("salud")) return "🫀";
  if(c.includes("estudio")) return "🎓";
  if(c.includes("proyecto")) return "🧩";
  if(c.includes("control")) return "🚫";
  return "✅";
}

function ensureConfig(state){
  if(!state.gamify) state.gamify = {};
  if(!state.gamify.rewardName) state.gamify.rewardName = "Hamburguesa 🍔";
  if(typeof state.gamify.pointsPerReward !== "number") state.gamify.pointsPerReward = 200;
  if(!Array.isArray(state.gamify.redeemed)) state.gamify.redeemed = []; // {at, type, note}
  if(!Array.isArray(state.gamify.customRewards)) state.gamify.customRewards = [
    { name:"Hamburguesa 🍔", cost:200 },
    { name:"Cheat meal 🍟", cost:250 },
    { name:"Cine/Salida 🎬", cost:300 },
  ];
  if(!Array.isArray(state.skills)) state.skills = DEFAULT_SKILLS_V4.map(s => ({ id: uid(), ...s }));
}

function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
    const today = new Date();
    const s = {
      viewYear: today.getFullYear(),
      viewMonth: today.getMonth(),
      selected: toISODate(today),
      habits: DEFAULT_HABITS_V4.map(h => ({ id: uid(), ...h })),
      entries: {}
    };
    ensureConfig(s);
    return s;
  }
  const s = safeParseJSON(raw, null);
  if(!s || !Array.isArray(s.habits) || typeof s.entries !== "object"){
    localStorage.removeItem(STORAGE_KEY);
    return loadState();
  }

  // migraciones suaves
  for(const h of s.habits){
    if(!h.id) h.id = uid();
    if(!h.icon) h.icon = guessIcon(h);
    if(!h.category) h.category = "General";
    if(!h.name) h.name = "Hábito";
    // Ajustes por petición: renombrar sin romper configs del usuario
    if(h.name === "Dormir ≥ 7.5 horas (horario fijo)") h.name = "Despertarse antes de las 8:00 am";
    if(h.name === "NO porno/masturbación") h.name = "NO P";
    if(typeof h.points !== "number") h.points = 1;
  }
  for(const k of Object.keys(s.entries)){
    const e = s.entries[k] || {};
    if(typeof e.checks !== "object") e.checks = {};
    if(typeof e.note !== "string") e.note = "";
    if(typeof e.journal !== "string") e.journal = "";
    if(typeof e.updatedAt !== "number") e.updatedAt = Date.now();
    if(typeof e.extras !== "object") e.extras = {};
    if(typeof e.extras.monthlyDone !== "object") e.extras.monthlyDone = {};
    if(typeof e.extras.skillDone !== "object") e.extras.skillDone = {};
    s.entries[k] = e;
  }
  if(!s.selected) s.selected = toISODate(new Date());
  if(typeof s.viewYear !== "number") s.viewYear = new Date().getFullYear();
  if(typeof s.viewMonth !== "number") s.viewMonth = new Date().getMonth();

  ensureConfig(s);
  return s;
}
function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function getEntry(state, dateStr){
  if(!state.entries[dateStr]){
    state.entries[dateStr] = { checks:{}, note:"", journal:"", extras:{ monthlyDone:{}, skillDone:{} }, updatedAt: Date.now() };
  }else{
    const e = state.entries[dateStr];
    if(typeof e.extras !== "object") e.extras = { monthlyDone:{}, skillDone:{} };
    if(typeof e.extras.monthlyDone !== "object") e.extras.monthlyDone = {};
    if(typeof e.extras.skillDone !== "object") e.extras.skillDone = {};
  }
  return state.entries[dateStr];
}
function completionFor(state, dateStr){
  const total = state.habits.length || 1;
  const e = state.entries[dateStr];
  if(!e) return { done:0, total, pct:0 };
  let done = 0;
  for(const h of state.habits){
    if(e.checks && e.checks[h.id]) done++;
  }
  return { done, total, pct: done/total };
}

// Regla de color que pediste
function tierFromPct(pct){
  if(pct >= 0.999) return 1.0;     // verde
  if(pct >= 0.75) return 0.75;     // amarillo
  if(pct >= 0.50) return 0.50;     // naranja
  return 0.0;                       // rojo
}
function tierLabel(t){
  if(t === 1.0) return "VERDE (100%)";
  if(t === 0.75) return "AMARILLO (≥75%)";
  if(t === 0.50) return "NARANJA (≥50%)";
  return "ROJO (<50%)";
}
function tierColor(t){
  if(t === 1.0) return "#65ff9a";
  if(t === 0.75) return "#ffe36e";
  if(t === 0.50) return "#ffb34a";
  return "#ff5a5a";
}

function monthStats(state, y, m){
  const dim = daysInMonth(y,m);
  let sumPct = 0;
  let sumTier = 0;
  let counts = { green:0, yellow:0, orange:0, red:0 };

  for(let d=1; d<=dim; d++){
    const iso = toISODate(new Date(y,m,d));
    const { pct } = completionFor(state, iso);
    const t = tierFromPct(pct);
    sumPct += pct;
    sumTier += t;
    if(t === 1.0) counts.green++;
    else if(t === 0.75) counts.yellow++;
    else if(t === 0.50) counts.orange++;
    else counts.red++;
  }

  const avgPct = dim ? (sumPct/dim) : 0;
  const avgTier = dim ? (sumTier/dim) : 0;

  const misses = state.habits.map(h => ({ id:h.id, name:h.name, icon:h.icon, miss:0, total:dim }));
  for(let d=1; d<=dim; d++){
    const iso = toISODate(new Date(y,m,d));
    const e = state.entries[iso];
    for(const h of state.habits){
      const isDone = !!(e && e.checks && e.checks[h.id]);
      if(!isDone){
        const row = misses.find(x => x.id === h.id);
        row.miss++;
      }
    }
  }
  misses.sort((a,b)=> b.miss - a.miss);

  let bestStreak = 0;
  let cur = 0;
  for(let d=1; d<=dim; d++){
    const iso = toISODate(new Date(y,m,d));
    const { pct } = completionFor(state, iso);
    const t = tierFromPct(pct);
    if(t >= 0.75){ cur++; bestStreak = Math.max(bestStreak, cur); }
    else cur = 0;
  }

  return {
    dim,
    avgPct,
    avgTier,
    counts,
    bestStreak,
    worstHabits: misses.slice(0,5),
  };
}

// Vision board
function loadBoard(){
  const raw = localStorage.getItem(BOARD_KEY);
  if(!raw){
    return {
      vision: [
        "🎓 Entrar a una universidad top (MIT o equivalente)",
        "🏋️ Cuerpo atlético (fuerte + definido)",
        "🧠 Ser brutal en matemáticas y redes neuronales",
        "💻 Programación a nivel pro (proyectos reales)",
        "📝 Informes y redacción nivel competencia",
        "🎤 Exposición segura (hablar como líder)",
        "💰 Mucha feria (pero con cabeza)",
        "🤝 Ayudar gente (impacto real)",
        "⏰ Levantarme temprano diario",
        "🥗 Comer sano diario",
      ],
      anti: [
        "🧃 Procrastinar diario y vivir en dopamina barata",
        "📉 Quedarme en mediocridad (sin proyectos reales)",
        "🐷 Salud culera: gordo, cansado, sin energía",
        "📱 TikTok/scroll infinito controlándome",
        "🧠 No saber matemáticas / no entender lo que hago",
        "📝 No poder escribir ni explicar un informe",
        "🎤 Miedo escénico / hablar con pena",
        "💸 Sin feria por falta de disciplina",
        "🚩 Relación basura que me drena",
        "🕳️ Acabar en un camino que no quiero",
      ],
    };
  }
  const b = safeParseJSON(raw, null);
  if(!b || !Array.isArray(b.vision) || !Array.isArray(b.anti)) return loadBoard();
  return b;
}
function saveBoard(board){
  localStorage.setItem(BOARD_KEY, JSON.stringify(board));
}

// Gamificación: retos + bonus + puntos
function hash32(str){
  let h = 2166136261;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}
function dailyChallengeFor(dateStr){
  const idx = hash32("daily:" + dateStr) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[idx];
}
function monthlyBonusesFor(y,m){
  const list = MONTHLY_BONUS_BY_MONTH[m] || [];
  return list.slice(0,2);
}
function pointsForHabits(state, dateStr){
  const e = state.entries[dateStr];
  if(!e) return 0;
  let pts = 0;
  for(const h of state.habits){
    if(e.checks && e.checks[h.id]) pts += (typeof h.points === "number" ? h.points : 1);
  }
  return pts;
}
function pointsForExtras(state, dateStr){
  const e = getEntry(state, dateStr);
  let pts = 0;

  const dc = dailyChallengeFor(dateStr);
  if(e.extras.dailyDone) pts += (dc.points || 10);

  const d = parseISODate(dateStr);
  const bonuses = monthlyBonusesFor(d.getFullYear(), d.getMonth());
  for(const b of bonuses){
    if(e.extras.monthlyDone && e.extras.monthlyDone[b.id]) pts += (b.points || 20);
  }

  if(e.extras.skillDone){
    for(const sid of Object.keys(e.extras.skillDone)){
      if(e.extras.skillDone[sid]){
        const sk = (state.skills || []).find(s => s.id === sid);
        if(sk) pts += (sk.points || 3);
      }
    }
  }
  return pts;
}
function pointsForDay(state, dateStr){
  return pointsForHabits(state, dateStr) + pointsForExtras(state, dateStr);
}
function totalPoints(state){
  let sum = 0;
  for(const dateStr of Object.keys(state.entries || {})){
    sum += pointsForDay(state, dateStr);
  }
  return sum;
}
function rewardsAvailable(state){
  const total = totalPoints(state);
  const redeemedCount = (state.gamify?.redeemed || []).length;
  const cost = state.gamify?.pointsPerReward || 200;
  const earned = Math.floor(total / cost);
  const available = Math.max(0, earned - redeemedCount);
  return { total, earned, redeemed: redeemedCount, available, cost };
}

window.BGT = {
  STORAGE_KEY, BOARD_KEY,
  uid, pad, toISODate, parseISODate,
  daysInMonth, startOfMonth, mondayIndex, monthNameES,
  DEFAULT_HABITS_V4, DEFAULT_SKILLS_V4,
  loadState, saveState, getEntry, completionFor,
  tierFromPct, tierLabel, tierColor,
  monthStats,
  loadBoard, saveBoard,
  DAILY_CHALLENGES, MONTHLY_BONUS_BY_MONTH,
  dailyChallengeFor, monthlyBonusesFor,
  pointsForDay, totalPoints, rewardsAvailable,
};

// PWA: registra el service worker (cache offline + instalable en home screen).
// Si abres el sitio con doble click (file://) esto no corre — necesitas http(s),
// por eso lo ideal es subirlo a GitHub Pages o correrlo con Live Server / un server local.
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("SW no se pudo registrar:", err);
    });
  });
}
