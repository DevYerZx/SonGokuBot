/**
 * ================================
 *        Mini Lurus - WaBot
 * ================================
 * Creado por: Carlos Alexis (Zam)
 * Año: 2025
 * Librería: Baileys
 * Mejorado y estabilizado por DvYer
 * ================================
 */

require("./settings");
require("./lib/database");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidDecode,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const os = require("os");
const { smsg } = require("./lib/message");
const { Boom } = require("@hapi/boom");
const { exec } = require("child_process");

/* ================== PROTECCIÓN ANTI CRASH ================== */
process.on("unhandledRejection", (err) => {
  console.log("❌ PROMISE NO CAPTURADA:", err?.message || err);
});

process.on("uncaughtException", (err) => {
  console.log("❌ EXCEPCIÓN NO CAPTURADA:", err?.message || err);
});

/* ================== SESIÓN ================== */
const sessionDir = global.sessionName || "SonGokuBot_session";
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
  console.log("📁 Carpeta de sesión creada:", sessionDir);
}

/* ================== LOGS ================== */
const print = (label, value) =>
  console.log(
    `${chalk.green.bold("║")} ${chalk.cyan.bold(label.padEnd(14))}${chalk.magenta.bold(":")} ${value}`,
  );

const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(text, (ans) => {
      rl.close();
      resolve(ans.trim());
    }),
  );
};

const log = {
  info: (m) => console.log(chalk.bgBlue.white(" INFO "), m),
  success: (m) => console.log(chalk.bgGreen.white(" OK "), m),
  warning: (m) => console.log(chalk.bgYellow.black(" WARN "), m),
  error: (m) => console.log(chalk.bgRed.white(" ERROR "), m),
};

/* ================== SYSTEM INFO (SEGURO) ================== */
const safeUser = () => {
  try {
    return os.userInfo().username;
  } catch {
    return "container";
  }
};

console.log(
  chalk.yellow.bold(
    `╔═════[${safeUser()}@${os.hostname()}]═════`,
  ),
);
print("OS", `${os.platform()} ${os.release()}`);
print("CPU", os.cpus()[0]?.model || "unknown");
print("RAM", `${(os.freemem() / 1024 / 1024).toFixed(0)} MB libres`);
print("Node", process.version);
print("Baileys", "WhiskeySockets");
console.log(chalk.yellow.bold("╚" + "═".repeat(36)));

/* ================== START BOT ================== */
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const client = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: ["Ubuntu", "Chrome", "120"],
  });

  /* ================== AUTH ================== */
  if (!client.authState.creds.registered) {
    let phoneNumber = process.env.PAIRING_NUMBER;

    if (!phoneNumber) {
      phoneNumber = await question(
        "📱 Ingresa tu número (ej: 51999999999): ",
      );
    }

    try {
      const pairing = await client.requestPairingCode(
        phoneNumber,
        "SONGOKU1",
      );
      log.success(`Código de emparejamiento: ${pairing}`);
      log.info("WhatsApp → Dispositivos vinculados → Vincular");
    } catch (err) {
      log.error("Falló el emparejamiento");
      console.error(err);

      exec(`rm -rf ${sessionDir}/*`);
      log.warning("Reintentando en 5 segundos...");
      setTimeout(startBot, 5000);
      return;
    }
  }

  await global.loadDatabase();
  log.success("Base de datos cargada");

  /* ================== HELPERS ================== */
  client.sendText = (jid, text, quoted = "", options = {}) =>
    client.sendMessage(jid, { text, ...options }, { quoted });

  /* ================== LIMPIEZA TMP ================== */
  const tmpDir = path.join(__dirname, "tmp");
  setInterval(() => {
    try {
      if (!fs.existsSync(tmpDir)) return;
      for (const f of fs.readdirSync(tmpDir)) {
        fs.unlinkSync(path.join(tmpDir, f));
      }
    } catch {}
  }, 15 * 60 * 1000);

  /* ================== CONNECTION ================== */
  client.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      log.success("Conectado correctamente");
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

      if (
        reason === DisconnectReason.connectionClosed ||
        reason === DisconnectReason.connectionLost ||
        reason === DisconnectReason.restartRequired
      ) {
        log.warning("Reconectando...");
        startBot();
      }

      if (reason === DisconnectReason.loggedOut) {
        log.warning("Sesión cerrada, limpiando...");
        exec(`rm -rf ${sessionDir}/*`);
        setTimeout(startBot, 3000);
      }
    }
  });

  /* ================== MENSAJES ================== */
  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      let m = messages[0];
      if (!m?.message) return;
      if (m.key.remoteJid === "status@broadcast") return;

      m = smsg(client, m);
      require("./main")(client, m, messages);
    } catch (e) {
      console.log("Error mensaje:", e);
    }
  });

  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const d = jidDecode(jid) || {};
      return d.user && d.server ? `${d.user}@${d.server}` : jid;
    }
    return jid;
  };

  client.ev.on("creds.update", saveCreds);
}

startBot();

/* ================== HOT RELOAD ================== */
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellow("♻ index actualizado"));
  delete require.cache[file];
  require(file);
});

