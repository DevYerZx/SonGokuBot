const fs = require("fs");
const path = require("path");

/* ================== CONFIG ================== */

// solicitudes por minuto (usuarios normales)
const USER_LIMIT = 5;

// solicitudes por minuto (global)
const GLOBAL_LIMIT = 40;

// tiempo ventana
const WINDOW = 60 * 1000;

// usuarios con prioridad
const PRIORITY_PATH = path.join(process.cwd(), "database", "priority-users.json");

/* ================== MEMORIA ================== */

const userHits = new Map();
let globalHits = [];

/* ================== HELPERS ================== */

const getNumber = (jid) => jid.split("@")[0];

const isOwner = (jid) => {
  const num = getNumber(jid);
  return global.owner.includes(num);
};

const getPriorityDB = () => {
  if (!fs.existsSync(PRIORITY_PATH)) return {};
  return JSON.parse(fs.readFileSync(PRIORITY_PATH));
};

/* ================== RATE LIMIT ================== */

module.exports = (m) => {
  const now = Date.now();
  const sender = m.sender;

  /* 👑 OWNER SIN LÍMITES */
  if (isOwner(sender)) return { allowed: true };

  /* 🧹 LIMPIAR GLOBAL */
  globalHits = globalHits.filter(t => now - t < WINDOW);
  if (globalHits.length >= GLOBAL_LIMIT) {
    return {
      allowed: false,
      reason: "🌐 El bot está saturado, intenta más tarde."
    };
  }

  /* 🧹 LIMPIAR USUARIO */
  if (!userHits.has(sender)) userHits.set(sender, []);
  const hits = userHits.get(sender).filter(t => now - t < WINDOW);

  const priorityDB = getPriorityDB();
  const limit = priorityDB[sender] || USER_LIMIT;

  if (hits.length >= limit) {
    return {
      allowed: false,
      reason: `⏳ Has alcanzado tu límite (*${limit} comandos/min*).`
    };
  }

  /* ✅ REGISTRAR */
  hits.push(now);
  userHits.set(sender, hits);
  globalHits.push(now);

  return { allowed: true };
};

