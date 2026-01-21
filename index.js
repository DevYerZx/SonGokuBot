/**
 * ================================
 *        Mini Lurus - WaBot
 * ================================
 * Creado por: Carlos Alexis (Zam)
 * Año: 2025
 * Librería: Baileys
 * ================================
 * Mejorado por DvYer
 * (auto eliminación de archivos tmp)
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
const os = require("os");
const { smsg } = require("./lib/message");
const { Boom } = require("@hapi/boom");

/* ================== SESIÓN ================== */
const sessionDir = global.sessionName || "SonGokuBot_session";
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
  console.log("📁 Carpeta de sesión creada:", sessionDir);
}

/* ================== PROTECCIÓN ================== */
process.on("unhandledRejection", (err) => {
  console.log("❌ PROMISE NO CAPTURADA:", err);
});

process.on("uncaughtException", (err) => {
  console.log("❌ EXCEPCIÓN NO CAPTURADA:", err);
});

/* ================== LOGS ================== */
const log = {
  info: (msg) => console.log(chalk.bgBlue.white.bold("INFO"), chalk.white(msg)),
  success: (msg) =>
    console.log(chalk.bgGreen.white.bold("SUCCESS"), chalk.greenBright(msg)),
  warning: (msg) =>
    console.log(chalk.bgYellowBright.red.bold("WARNING"), chalk.yellow(msg)),
  error: (msg) =>
    console.log(chalk.bgRed.white.bold("ERROR"), chalk.redBright(msg)),
};

/* ================== SYSTEM INFO ================== */
const print = (label, value) =>
  console.log(
    `${chalk.green.bold("║")} ${chalk.cyan.bold(label.padEnd(16))}: ${value}`,
  );

console.log(
  chalk.yellow.bold(
    `╔═════[${os.userInfo().username}@${os.hostname()}]═════`,
  ),
);
print("OS", `${os.platform()} ${os.release()} ${os.arch()}`);
print("Node.js", process.version);
print("Baileys", "WhiskeySockets");
console.log(chalk.yellow.bold("╚" + "═".repeat(40)));

/* ================== CONTROL DE ARRANQUE ================== */
let isStarting = false;

/* ================== START BOT ================== */
async function startBot() {
  if (isStarting) return;
  isStarting = true;

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const client = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["Linux", "Opera"],
  });

  /* ================== AUTH ================== */
  if (!client.authState.creds.registered) {
    const phoneNumber = process.env.PAIRING_NUMBER;

    if (!phoneNumber) {
      log.error("❌ Define PAIRING_NUMBER en el panel");
      process.exit(1);
    }

    try {
      const code = await client.requestPairingCode(phoneNumber, "SONGOKU1");
      log.success(`📲 Código de emparejamiento: ${code}`);
    } catch (e) {
      log.error("❌ Error al emparejar");
      console.error(e);
      isStarting = false;
      return;
    }
  }

  await global.loadDatabase();
  log.success("Base de datos cargada");

  /* ================== TMP CLEAN ================== */
  const tmpDir = path.join(__dirname, "tmp");
  setInterval(() => {
    if (!fs.existsSync(tmpDir)) return;
    for (const f of fs.readdirSync(tmpDir)) {
      const p = path.join(tmpDir, f);
      if (fs.statSync(p).isFile()) fs.unlinkSync(p);
    }
  }, 15 * 60 * 1000);

  /* ================== CONNECTION ================== */
  client.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      log.success("Conectado correctamente");
      isStarting = false;
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

      if (
        reason === DisconnectReason.connectionLost ||
        reason === DisconnectReason.connectionClosed ||
        reason === DisconnectReason.restartRequired
      ) {
        log.warning("🔄 Reconectando...");
        isStarting = false;
        startBot();
      }

      if (reason === DisconnectReason.loggedOut) {
        log.error("❌ Sesión cerrada");
        process.exit(1);
      }
    }
  });

  /* ================== MESSAGES ================== */
  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      let m = messages[0];
      if (!m?.message) return;
      if (m.key.remoteJid === "status@broadcast") return;
      m = smsg(client, m);
      require("./main")(client, m);
    } catch (e) {
      console.log(e);
    }
  });

  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const d = jidDecode(jid) || {};
      return d.user && d.server ? d.user + "@" + d.server : jid;
    }
    return jid;
  };

  client.ev.on("creds.update", saveCreds);
}

startBot();

