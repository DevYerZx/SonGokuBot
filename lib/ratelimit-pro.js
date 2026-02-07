const fs = require("fs");
const path = require("path");

const PRIORITY_PATH = path.join(process.cwd(), "database", "priority-users.json");

const userLimits = new Map();
let globalCount = 0;
let globalTime = Date.now();

/* ======================
   CONFIG
====================== */
const USER_MAX = 5;
const OWNER_MAX = 30;
const USER_WINDOW = 60 * 1000;

const GLOBAL_MAX = 60;
const GLOBAL_WINDOW = 60 * 1000;

/* ======================
   LOAD PRIORITY USERS
====================== */
function loadPriority() {
  if (!fs.existsSync(PRIORITY_PATH)) {
    fs.mkdirSync(path.dirname(PRIORITY_PATH), { recursive: true });
    fs.writeFileSync(PRIORITY_PATH, "{}");
  }
  return JSON.parse(fs.readFileSync(PRIORITY_PATH));
}

module.exports = (m, client) => {
  const now = Date.now();
  const sender = m.sender;
  const botNumber = client.user.id.split(":")[0] + "@s.whatsapp.net";

  if (sender === botNumber) return { allowed: true };

  const priorityUsers = loadPriority();

  const isOwner = global.owner.includes(sender);
  const customLimit = priorityUsers[sender];

  const maxUser = customLimit
    ? customLimit
    : isOwner
    ? OWNER_MAX
    : USER_MAX;

  /* ===== GLOBAL ===== */
  if (now - globalTime > GLOBAL_WINDOW) {
    globalTime = now;
    globalCount = 0;
  }

  if (globalCount >= GLOBAL_MAX && !isOwner) {
    return {
      allowed: false,
      reason: "global",
      wait: Math.ceil((GLOBAL_WINDOW - (now - globalTime)) / 1000)
    };
  }

  /* ===== USER ===== */
  const data = userLimits.get(sender) || { count: 0, time: now };

  if (now - data.time > USER_WINDOW) {
    userLimits.set(sender, { count: 1, time: now });
    globalCount++;
    return { allowed: true };
  }

  if (data.count >= maxUser) {
    return {
      allowed: false,
      reason: "user",
      wait: Math.ceil((USER_WINDOW - (now - data.time)) / 1000)
    };
  }

  data.count++;
  userLimits.set(sender, data);
  globalCount++;

  return { allowed: true };
};
