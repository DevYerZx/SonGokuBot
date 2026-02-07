const fs = require("fs");
const path = require("path");

/* ================== CONFIG ================== */

const USER_LIMIT = 5;
const GLOBAL_LIMIT = 40;
const WINDOW = 60 * 1000;

const DB_PATH = path.join(process.cwd(), "database", "priority-users.json");

/* ================== MEMORIA ================== */

const userHits = new Map();
let globalHits = [];

/* ================== HELPERS ================== */

const getNumber = (jid) => jid.split("@")[0];

const isOwner = (jid) => {
  const num = getNumber(jid);
  return global.owner.includes(num);
};

const loadDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, "{}");
  }
  return JSON.parse(fs.readFileSync(DB_PATH));
};

const saveDB = (db) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
};

/* ================== RATE LIMIT ================== */

module.exports = (m) => {
  const now = Date.now();
  const sender = m.sender;

  /* 👑 OWNER LIBRE */
  if (isOwner(sender)) return { allowed: true };

  const db = loadDB();

  /* 🆕 PRIMER USO GRATIS */
  if (!db[sender]) {
    db[sender] = { free: true, limit: USER_LIMIT };
    saveDB(db);
    return { allowed: true };
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

  const limit = db[sender].limit || USER_LIMIT;

  if (hits.length >= limit) {
    return {
      allowed: false,
      reason: `⏳ Límite alcanzado (*${limit} comandos/min*).`
    };
  }

  /* ✅ REGISTRAR */
  hits.push(now);
  userHits.set(sender, hits);
  globalHits.push(now);

  return { allowed: true };
};
