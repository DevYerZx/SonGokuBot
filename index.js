/**
 * ================================
 *        Mini Lurus - WaBot
 * ================================
 * Creado por: Carlos Alexis (Zam)
 * Año: 2025
 * Librería: Baileys
 * Mejorado y corregido (estabilidad)
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

/* ================== SESIÓN ================== */
const sessionDir = global.sessionName || "SonGokuBot_session";
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

/* ================== PROTECCIÓN ================== */
process.on("unhandledRejection", (e) =>
  console.log("❌ PROMISE NO CAPTURADA:", e?.message || e),
);
process.on("uncaughtException", (e) =>
  console.log("❌ EXCEPCIÓN NO CAPTURADA:", e?.message || e),
);

/* ================== LOGS ================== */
const print = (label, value) =>
  console.log(
    `${chalk.green.bold("║")} ${chalk.cyan.bold(label.padEnd(16))}${chalk.magenta.bold(":")} ${value}`,
  );

const log = {
  info: (msg) => console.log(chalk.bgBlue.white(" INFO "), msg),
  success: (msg) => console.log(chalk.bgGreen.white(" OK "), msg),
  warning: (msg) => console.log(chalk.bgYellow.black(" WARN "), msg),
  error: (msg) => console.log(chalk.bgRed.white(" ERROR "), msg),
};

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

/* ================== SYSTEM INFO ================== */
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
print("OS", `${os.platform()} ${os.arch()}`);
print("Node.js", process.version);
print("Baileys", "WhiskeySockets");
console.log(chalk.yellow.bold("╚════════════════════════════════════"));

/* ================== START BOT ================== */
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const client = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["Ubuntu", "Chrome", "22.04"],
  });

  /* ================== AUTH (CORREGIDO) ================== */
  if (!state.creds.registered) {
    let phone = process.env.PAIRING_NUMBER;

    if (!phone) {
      phone = await question("📱 Ingresa tu número (ej: 51999999999): ");
    }

    try {
      const code = await client.requestPairingCode(phone);
      log.success(`Código de emparejamiento: ${code}`);
      log.info("WhatsApp → Dispositivos vinculados → Vincular");
    } catch (e) {
      log.error("Fallo al generar el código");
      console.error(e);
      return;
    }
  }

  await global.loadDatabase();
  log.success("Base de datos cargada");

  client.ev.on("creds.update", saveCreds);

  /* ================== CONEXIÓN ================== */
  client.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      log.success("Conectado correctamente");
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

      log.warning("Reconectando...");

      if (
        reason === DisconnectReason.connectionClosed ||
        reason === DisconnectReason.connectionLost ||
        reason === DisconnectReason.restartRequired
      ) {
        startBot();
      }

      if (reason === DisconnectReason.loggedOut) {
        log.error("Sesión cerrada, elimina carpeta y vuelve a vincular");
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
      require("./main")(client, m);
    } catch (e) {
      console.log(e);
    }
  });

  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {};
      return decode.user && decode.server
        ? decode.user + "@" + decode.server
        : jid;
    }
    return jid;
  };
}

startBot();

/* ================== HOT RELOAD ================== */
const file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellow("♻ index actualizado"));
  delete require.cache[file];
  require(file);
});


