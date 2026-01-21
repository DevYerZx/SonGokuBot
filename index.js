/**
 * ================================
 *        Mini Lurus - WaBot
 * ================================
 * Mejorado y estabilizado por: DvYer
 * Librería: Baileys (Actual)
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

/* ================== PROTECCIÓN GLOBAL ================== */
process.on("unhandledRejection", (reason) => {
  console.log(chalk.red("❌ PROMISE NO CAPTURADA:"), reason);
});

process.on("uncaughtException", (err) => {
  console.log(chalk.red("❌ ERROR NO CAPTURADO:"), err);
});

/* ================== LOGS ================== */
const log = {
  info: (msg) => console.log(chalk.bgBlue.white(" INFO "), msg),
  success: (msg) => console.log(chalk.bgGreen.white(" OK "), msg),
  warning: (msg) => console.log(chalk.bgYellow.black(" WARN "), msg),
  error: (msg) => console.log(chalk.bgRed.white(" ERR "), msg),
};

const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(text, resolve));
};

/* ================== SYSTEM INFO ================== */
console.log(chalk.yellow(`Node: ${process.version}`));
console.log(chalk.yellow(`OS: ${os.platform()} ${os.arch()}`));

let client;
let isStarting = false;

/* ================== START BOT ================== */
async function startBot() {
  if (isStarting) return;
  isStarting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
    const { version } = await fetchLatestBaileysVersion();

    client = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      auth: state,
      browser: ["Linux", "Chrome"],
    });

    /* ================== AUTH ================== */
    if (!client.authState.creds.registered) {
      const phoneNumber = await question("📱 Ingresa tu número (ej: 519999999): ");
      const pairing = await client.requestPairingCode(phoneNumber, "SONGOKU1");
      log.success(`Código de emparejamiento: ${pairing}`);
    }

    await global.loadDatabase();
    log.success("Base de datos cargada");

    client.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server ? decode.user + "@" + decode.server : jid;
      }
      return jid;
    };

    /* ================== CONNECTION ================== */
    client.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output.statusCode;

        if (
          reason === DisconnectReason.connectionLost ||
          reason === DisconnectReason.connectionClosed ||
          reason === DisconnectReason.restartRequired
        ) {
          log.warning("Reconectando...");
          isStarting = false;
          startBot();
        } else if (reason === DisconnectReason.loggedOut) {
          log.error("Sesión cerrada");
          exec("rm -rf ./*session*");
          process.exit(1);
        }
      }

      if (connection === "open") {
        log.success("Bot conectado correctamente");
      }
    });

    /* ================== MENSAJES ================== */
    client.ev.on("messages.upsert", async ({ messages }) => {
      try {
        let m = messages[0];
        if (!m.message) return;
        if (m.key.remoteJid === "status@broadcast") return;

        m = smsg(client, m);

        await require("./main")(client, m);
      } catch (e) {
        console.log(chalk.red("Error en mensaje:"), e);
      }
    });

    client.ev.on("creds.update", saveCreds);
  } catch (e) {
    log.error("Error crítico en startBot");
    console.log(e);
    isStarting = false;
  }
}

startBot();

/* ================== HOT RELOAD ================== */
const file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`Actualizado ${__filename}`));
  delete require.cache[file];
  require(file);
});
