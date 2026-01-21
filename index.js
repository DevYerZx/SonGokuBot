/**
 * ================================
 *        SonGokuBot - Stable
 * ================================
 * Mejorado por: DvYer
 * Base: Mini Lurus
 * Librería: Baileys
 * ================================
 */

process.on("unhandledRejection", err => {
  console.error("❌ PROMESA NO MANEJADA:", err);
});

process.on("uncaughtException", err => {
  console.error("❌ EXCEPCIÓN NO CAPTURADA:", err);
});

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

/* ================== LOG ================== */
const log = {
  info: m => console.log(chalk.blue("[INFO]"), m),
  success: m => console.log(chalk.green("[SUCCESS]"), m),
  error: m => console.log(chalk.red("[ERROR]"), m),
};

const question = text =>
  new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(text, ans => {
      rl.close();
      resolve(ans);
    });
  });

/* ================== START ================== */
async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      browser: ["SonGokuBot", "Chrome", "1.0.0"],
    });

    /* ===== AUTH ===== */
    if (!client.authState.creds.registered) {
      const phone = await question("📱 Número (ej: 519999999): ");
      const code = await client.requestPairingCode(phone);
      log.success("Código: " + code);
    }

    await global.loadDatabase();
    log.success("Base de datos cargada");

    client.decodeJid = jid => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server ? decode.user + "@" + decode.server : jid;
      }
      return jid;
    };

    /* ===== CONNECTION ===== */
    client.ev.on("connection.update", ({ connection, lastDisconnect }) => {
      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

        if (
          reason === DisconnectReason.connectionLost ||
          reason === DisconnectReason.restartRequired
        ) {
          log.info("Reconectando...");
          startBot();
        }

        if (reason === DisconnectReason.loggedOut) {
          exec(`rm -rf ${global.sessionName}`);
          process.exit(1);
        }
      }

      if (connection === "open") log.success("Conectado correctamente");
    });

    /* ===== MESSAGES ===== */
    client.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const m = messages[0];
        if (!m?.message) return;
        if (m.key.remoteJid === "status@broadcast") return;

        const msg = smsg(client, m);
        require("./main")(client, msg);
      } catch (e) {
        console.error("Error en mensaje:", e);
      }
    });

    client.ev.on("creds.update", saveCreds);

    /* ===== LIMPIEZA TMP (SIN SPAM) ===== */
    const tmp = path.join(__dirname, "tmp");

    setInterval(() => {
      try {
        if (!fs.existsSync(tmp)) return;
        fs.readdirSync(tmp).forEach(f => {
          const p = path.join(tmp, f);
          if (fs.statSync(p).isFile()) fs.unlinkSync(p);
        });
      } catch {}
    }, 30 * 60 * 1000);

  } catch (err) {
    console.error("FATAL START ERROR:", err);
    process.exit(1);
  }
}

startBot();

