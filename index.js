/**
 * ================================
 *        SonGokuBot - WaBot
 * ================================
 * Mejorado y estabilizado por DvYer
 * Base: Mini Lurus
 * Librería: Baileys (WhiskeySockets)
 * Node: v20+
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
  console.error("❌ PROMISE NO CAPTURADA:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ EXCEPCIÓN NO CAPTURADA:", err);
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
    `${chalk.green("║")} ${chalk.cyan(label.padEnd(14))}: ${value}`,
  );

const log = {
  info: (msg) => console.log(chalk.blue("INFO"), msg),
  success: (msg) => console.log(chalk.green("OK"), msg),
  warn: (msg) => console.log(chalk.yellow("WARN"), msg),
  error: (msg) => console.log(chalk.red("ERROR"), msg),
};

const question = (text) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(text, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });

/* ================== INFO SISTEMA ================== */
console.log(chalk.yellow.bold("╔════════════════════════════════════"));
print("OS", `${os.platform()} ${os.release()} ${os.arch()}`);
print("Uptime", `${Math.floor(os.uptime() / 3600)} h`);
print("CPU", os.cpus()[0]?.model || "unknown");
print(
  "RAM",
  `${(os.freemem() / 1024 / 1024).toFixed(0)} / ${(os.totalmem() / 1024 / 1024).toFixed(0)} MB`,
);
print("Node", process.version);
print("Baileys", "WhiskeySockets");
console.log(chalk.yellow.bold("╚════════════════════════════════════"));

/* ================== START BOT ================== */
let client;
let isConnecting = false;

async function startBot() {
  if (isConnecting) return;
  isConnecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    client = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      browser: ["SonGokuBot", "Chrome", "1.0"],
    });

    /* ================== AUTH ================== */
    if (!client.authState.creds.registered) {
      const phone = await question("📱 Ingresa tu número (ej: 519999999): ");
      try {
        const code = await client.requestPairingCode(phone, "SONGOKU1");
        log.success(`Código de emparejamiento: ${code}`);
      } catch (e) {
        log.error("Fallo al emparejar");
        process.exit(1);
      }
    }

    await global.loadDatabase();
    log.success("Base de datos cargada");

    /* ================== HELPERS ================== */
    client.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const d = jidDecode(jid) || {};
        return d.user && d.server ? `${d.user}@${d.server}` : jid;
      }
      return jid;
    };

    client.ev.on("creds.update", saveCreds);

    /* ================== CONEXIÓN ================== */
    client.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "open") {
        isConnecting = false;
        log.success("Bot conectado correctamente");
      }

      if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;

        if (
          reason === DisconnectReason.connectionClosed ||
          reason === DisconnectReason.connectionLost ||
          reason === DisconnectReason.restartRequired
        ) {
          log.warn("Reconectando...");
          setTimeout(startBot, 3000);
        } else if (reason === DisconnectReason.loggedOut) {
          log.error("Sesión cerrada");
          exec(`rm -rf ${sessionDir}`);
          process.exit(1);
        }
      }
    });

    /* ================== MENSAJES ================== */
    client.ev.on("messages.upsert", async ({ messages }) => {
      try {
        const msg = messages[0];
        if (!msg?.message) return;
        if (msg.key.remoteJid === "status@broadcast") return;

        const m = smsg(client, msg);
        await require("./main")(client, m, messages);
      } catch (e) {
        console.error("Error en mensaje:", e);
      }
    });

    /* ================== LIMPIEZA TMP ================== */
    const tmpDir = path.join(__dirname, "tmp");
    setInterval(() => {
      try {
        if (!fs.existsSync(tmpDir)) return;
        for (const f of fs.readdirSync(tmpDir)) {
          const p = path.join(tmpDir, f);
          if (fs.statSync(p).isFile()) fs.unlinkSync(p);
        }
      } catch {}
    }, 15 * 60 * 1000);
  } catch (err) {
    console.error("Error crítico:", err);
    isConnecting = false;
    setTimeout(startBot, 5000);
  }
}

startBot();

/* ================== HOT RELOAD ================== */
const file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellow("♻ index.js actualizado"));
  delete require.cache[file];
  require(file);
});

