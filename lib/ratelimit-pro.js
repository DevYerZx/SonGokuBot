//
const fs = require("fs");
const path = require("path");

/* ================= CONFIG ================= */

const DEFAULT_LIMIT = 5;
const DEFAULT_CREDITS = 5; // créditos iniciales
const GLOBAL_LIMIT = 40;
const WINDOW = 60 * 1000;

const DB_PATH = path.join(process.cwd(), "database", "priority-users.json");

/* ================= MEMORIA ================= */

const userHits = new Map();
let globalHits = [];

/* ================= HELPERS ================= */

const getNumber = jid => jid.split("@")[0];

const isOwner = jid =>
  global.owner.includes(getNumber(jid));

const loadDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, "{}");
  }
  return JSON.parse(fs.readFileSync(DB_PATH));
};

const saveDB = db =>
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

/* ================= RATE LIMIT + COBRO ================= */

module.exports = (m) => {
  const now = Date.now();
  const sender = m.sender;

  /* 👑 OWNER GRATIS */
  if (isOwner(sender)) return { allowed: true };

  let db = loadDB();

  /* 🆕 PRIMER USO GRATIS */
  if (!db[sender]) {
    db[sender] = {
      free: true,
      limit: DEFAULT_LIMIT,
      credits: DEFAULT_CREDITS
    };
    saveDB(db);
    return { allowed: true };
  }

  /* 💰 SIN CRÉDITOS */
  if (db[sender].credits <= 0) {
    return {
      allowed: false,
      reason: "❌ Te quedaste sin créditos.\n💳 Compra o pide recarga al owner."
    };
  }

  /* 🌐 GLOBAL */
  globalHits = globalHits.filter(t => now - t < WINDOW);
  if (globalHits.length >= GLOBAL_LIMIT) {
    return {
      allowed: false,
      reason: "🌐 Bot saturado, intenta luego."
    };
  }

  /* 👤 USUARIO */
  if (!userHits.has(sender)) userHits.set(sender, []);
  const hits = userHits.get(sender).filter(t => now - t < WINDOW);

  if (hits.length >= db[sender].limit) {
    return {
      allowed: false,
      reason: `⏳ Límite alcanzado (${db[sender].limit}/min)`
    };
  }

  /* ✅ COBRAR */
  hits.push(now);
  userHits.set(sender, hits);
  globalHits.push(now);

  db[sender].credits -= 1;
  saveDB(db);

  return {
    allowed: true,
    credits: db[sender].credits
  };
};
