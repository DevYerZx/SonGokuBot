const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const { spawn } = require("child_process");

const REPO_ROOT = process.cwd();
const SUBBOT_ROOT = path.join(REPO_ROOT, "subbots");

function ensureSubbotStore() {
  if (!global.db?.data) {
    throw new Error("La base de datos aun no esta lista.");
  }

  if (!global.db.data.subbots || typeof global.db.data.subbots !== "object") {
    global.db.data.subbots = {};
  }

  return global.db.data.subbots;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeSubbotId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function sanitizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function ensureRuntimeDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function getSubbotPaths(id) {
  const safeId = sanitizeSubbotId(id);
  const runtimeDir = path.join(SUBBOT_ROOT, safeId);
  return {
    id: safeId,
    runtimeDir,
    sessionDir: path.join(runtimeDir, "session"),
    stdoutLog: path.join(runtimeDir, "stdout.log"),
    stderrLog: path.join(runtimeDir, "stderr.log"),
    pidFile: path.join(runtimeDir, "bot.pid"),
  };
}

function isOwnerJid(jid) {
  return global.owner.includes(String(jid || "").split("@")[0]);
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function writePidFile(filePath, pid) {
  fs.writeFileSync(filePath, String(pid), "utf8");
}

function readPidFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const pid = Number(fs.readFileSync(filePath, "utf8"));
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function isPidRunning(pid) {
  const numericPid = Number(pid);
  if (!Number.isInteger(numericPid) || numericPid <= 0) return false;

  try {
    process.kill(numericPid, 0);
    return true;
  } catch {
    return false;
  }
}

function removeFileSafe(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {}
}

function removeDirSafe(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch {}
}

function buildRecord(id, payload = {}) {
  const safeId = sanitizeSubbotId(id);
  const now = Date.now();
  return {
    id: safeId,
    alias: String(payload.alias || safeId).trim() || safeId,
    ownerJid: String(payload.ownerJid || "").trim() || null,
    phone: sanitizePhone(payload.phone || ""),
    port: Number(payload.port || 0) || 0,
    pid: Number(payload.pid || 0) || null,
    enabled: payload.enabled !== false,
    createdAt: Number(payload.createdAt || now),
    updatedAt: Number(payload.updatedAt || now),
    lastStartAt: Number(payload.lastStartAt || 0) || null,
    lastStopAt: Number(payload.lastStopAt || 0) || null,
    pairingCode: String(payload.pairingCode || "").trim().toUpperCase() || null,
    registered: Boolean(payload.registered),
    lastState: String(payload.lastState || "created").trim() || "created",
  };
}

function normalizeRecord(record) {
  return buildRecord(record?.id || record?.alias || "", record || {});
}

function extractCredsState(sessionDir) {
  const creds = readJsonSafe(path.join(sessionDir, "creds.json"));
  if (!creds) {
    return {
      pairingCode: null,
      registered: false,
    };
  }

  return {
    pairingCode: String(creds.pairingCode || "").trim().toUpperCase() || null,
    registered: Boolean(creds.registered),
  };
}

function deriveState(record, runtime) {
  if (runtime.registered && runtime.running) return "linked";
  if (runtime.registered) return "registered";
  if (runtime.running && runtime.pairingCode) return "pairing";
  if (runtime.running) return "running";
  if (runtime.pairingCode) return "pending";
  return record.enabled ? "stopped" : "disabled";
}

function getRecordRuntime(record) {
  const normalized = normalizeRecord(record);
  const paths = getSubbotPaths(normalized.id);
  const pidFromFile = readPidFile(paths.pidFile);
  const pid = pidFromFile || normalized.pid || null;
  const credsState = extractCredsState(paths.sessionDir);
  const running = isPidRunning(pid);

  if (!running && pidFromFile) {
    removeFileSafe(paths.pidFile);
  }

  return {
    ...normalized,
    ...paths,
    pid: running ? pid : null,
    pairingCode: credsState.pairingCode || normalized.pairingCode || null,
    registered: credsState.registered || normalized.registered || false,
    running,
    lastState: deriveState(normalized, {
      running,
      pairingCode: credsState.pairingCode || normalized.pairingCode || null,
      registered: credsState.registered || normalized.registered || false,
    }),
  };
}

async function writeRecord(record) {
  const store = ensureSubbotStore();
  store[record.id] = normalizeRecord(record);
  await global.db.write();
  return store[record.id];
}

async function refreshSubbot(id) {
  const store = ensureSubbotStore();
  const key = sanitizeSubbotId(id);
  const record = store[key];
  if (!record) return null;

  const refreshed = getRecordRuntime(record);
  store[key] = normalizeRecord({
    ...record,
    pid: refreshed.pid,
    pairingCode: refreshed.pairingCode,
    registered: refreshed.registered,
    lastState: refreshed.lastState,
    updatedAt: Date.now(),
  });
  await global.db.write();
  return getRecordRuntime(store[key]);
}

async function refreshAllSubbots() {
  const store = ensureSubbotStore();
  const ids = Object.keys(store);
  const results = [];

  for (const id of ids) {
    const refreshed = await refreshSubbot(id);
    if (refreshed) {
      results.push(refreshed);
    }
  }

  return results.sort((left, right) => left.alias.localeCompare(right.alias));
}

async function getAllSubbots() {
  return await refreshAllSubbots();
}

async function getSubbotStats() {
  const records = await getAllSubbots();
  const maxLinks = Math.max(1, Number(global.subbot?.maxLinks || 3) || 3);
  const running = records.filter((record) => record.running).length;
  const linked = records.filter((record) => record.registered).length;

  return {
    records,
    total: records.length,
    running,
    linked,
    maxLinks,
    availableSlots: Math.max(0, maxLinks - records.length),
  };
}

async function isPortAvailable(port) {
  return await new Promise((resolve) => {
    const tester = net.createServer();

    tester.once("error", () => {
      resolve(false);
    });

    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });

    tester.listen(port, "127.0.0.1");
  });
}

async function allocatePort() {
  const store = ensureSubbotStore();
  const reservedPorts = new Set(
    Object.values(store)
      .map((record) => Number(record?.port || 0))
      .filter((port) => Number.isInteger(port) && port > 0),
  );

  const startPort = Math.max(3001, Number(global.subbot?.basePort || 3300) || 3300);
  for (let port = startPort; port < startPort + 500; port += 1) {
    if (reservedPorts.has(port)) continue;
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error("No se encontro un puerto libre para el subbot.");
}

async function createSubbot(options = {}) {
  const store = ensureSubbotStore();
  const stats = await getSubbotStats();
  if (stats.total >= stats.maxLinks) {
    throw new Error(`Se alcanzo el limite de ${stats.maxLinks} subbots.`);
  }

  const alias = String(options.alias || "").trim();
  const id = sanitizeSubbotId(alias);
  if (!id) {
    throw new Error("Debes indicar un nombre valido para el subbot.");
  }

  if (store[id]) {
    throw new Error("Ya existe un subbot con ese nombre.");
  }

  const phone = sanitizePhone(options.phone || "");
  if (!phone || phone.length < 8) {
    throw new Error("Debes indicar un numero valido para vincular el subbot.");
  }

  const port = await allocatePort();
  const record = buildRecord(id, {
    alias,
    ownerJid: options.ownerJid || null,
    phone,
    port,
    enabled: true,
    lastState: "created",
  });

  store[id] = record;
  await global.db.write();
  return await startSubbot(id);
}

async function startSubbot(id) {
  const store = ensureSubbotStore();
  const key = sanitizeSubbotId(id);
  const current = store[key];
  if (!current) {
    throw new Error("Ese subbot no existe.");
  }

  const runtime = getRecordRuntime(current);
  if (runtime.running) {
    return runtime;
  }

  if (!runtime.phone || runtime.phone.length < 8) {
    throw new Error("El subbot no tiene un numero valido configurado.");
  }

  const paths = getSubbotPaths(key);
  ensureRuntimeDir(SUBBOT_ROOT);
  ensureRuntimeDir(paths.runtimeDir);
  ensureRuntimeDir(paths.sessionDir);

  const outFd = fs.openSync(paths.stdoutLog, "a");
  const errFd = fs.openSync(paths.stderrLog, "a");

  const child = spawn(process.execPath, ["index.js"], {
    cwd: REPO_ROOT,
    detached: true,
    env: {
      ...process.env,
      PORT: String(runtime.port || (await allocatePort())),
      PAIRING_NUMBER: runtime.phone,
      SONGOKU_SESSION_NAME: paths.sessionDir,
      SONGOKU_BOT_NAME: `${global.namebot} [${runtime.alias}]`,
      SONGOKU_RUNTIME_PROFILE: "subbot",
      SONGOKU_SUBBOT_ID: runtime.id,
    },
    stdio: ["ignore", outFd, errFd],
  });

  fs.closeSync(outFd);
  fs.closeSync(errFd);
  child.unref();

  writePidFile(paths.pidFile, child.pid);

  store[key] = normalizeRecord({
    ...current,
    pid: child.pid,
    enabled: true,
    updatedAt: Date.now(),
    lastStartAt: Date.now(),
    lastState: "starting",
  });
  await global.db.write();

  await wait(2500);
  return await refreshSubbot(key);
}

async function stopSubbot(id) {
  const store = ensureSubbotStore();
  const key = sanitizeSubbotId(id);
  const current = store[key];
  if (!current) {
    throw new Error("Ese subbot no existe.");
  }

  const runtime = getRecordRuntime(current);
  if (runtime.pid && runtime.running) {
    try {
      process.kill(runtime.pid, "SIGTERM");
    } catch {}

    for (let index = 0; index < 8; index += 1) {
      await wait(400);
      if (!isPidRunning(runtime.pid)) {
        break;
      }
    }

    if (isPidRunning(runtime.pid)) {
      try {
        process.kill(runtime.pid, "SIGKILL");
      } catch {}
    }
  }

  removeFileSafe(runtime.pidFile);
  store[key] = normalizeRecord({
    ...current,
    pid: null,
    enabled: false,
    updatedAt: Date.now(),
    lastStopAt: Date.now(),
    lastState: current.registered ? "registered" : "stopped",
  });
  await global.db.write();
  return await refreshSubbot(key);
}

async function restartSubbot(id) {
  const stopped = await stopSubbot(id);
  await wait(1200);
  return await startSubbot(stopped.id);
}

async function updateSubbotPhone(id, phone) {
  const store = ensureSubbotStore();
  const key = sanitizeSubbotId(id);
  const current = store[key];
  if (!current) {
    throw new Error("Ese subbot no existe.");
  }

  const cleanPhone = sanitizePhone(phone);
  if (!cleanPhone || cleanPhone.length < 8) {
    throw new Error("Debes indicar un numero valido.");
  }

  store[key] = normalizeRecord({
    ...current,
    phone: cleanPhone,
    updatedAt: Date.now(),
  });
  await global.db.write();
  return await refreshSubbot(key);
}

async function deleteSubbot(id) {
  const store = ensureSubbotStore();
  const key = sanitizeSubbotId(id);
  const current = store[key];
  if (!current) {
    throw new Error("Ese subbot no existe.");
  }

  await stopSubbot(key).catch(() => null);
  removeDirSafe(getSubbotPaths(key).runtimeDir);
  delete store[key];
  await global.db.write();
  return true;
}

async function getSubbot(id) {
  const store = ensureSubbotStore();
  const key = sanitizeSubbotId(id);
  if (!store[key]) return null;
  return await refreshSubbot(key);
}

async function startConfiguredSubbots() {
  if ((process.env.SONGOKU_RUNTIME_PROFILE || "main") !== "main") {
    return [];
  }

  const store = ensureSubbotStore();
  const ids = Object.keys(store);
  const started = [];

  for (const id of ids) {
    const record = getRecordRuntime(store[id]);
    if (!record.enabled || record.running) {
      continue;
    }

    try {
      const instance = await startSubbot(id);
      started.push(instance);
    } catch {}
  }

  return started;
}

function formatTimestamp(value) {
  const stamp = Number(value || 0);
  if (!stamp) return "N/A";
  return new Date(stamp).toLocaleString("es-PE");
}

function maskPhone(value) {
  const phone = sanitizePhone(value);
  if (phone.length <= 4) return phone || "N/A";
  return `${phone.slice(0, 3)}***${phone.slice(-3)}`;
}

module.exports = {
  REPO_ROOT,
  SUBBOT_ROOT,
  isOwnerJid,
  sanitizeSubbotId,
  sanitizePhone,
  getSubbotPaths,
  getSubbot,
  getAllSubbots,
  getSubbotStats,
  createSubbot,
  startSubbot,
  stopSubbot,
  restartSubbot,
  updateSubbotPhone,
  deleteSubbot,
  refreshSubbot,
  refreshAllSubbots,
  startConfiguredSubbots,
  formatTimestamp,
  maskPhone,
};
