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
const readline = require("readline");
const os = require("os");
const { smsg } = require("./lib/message");
const { app, server } = require("./lib/server");
const { Boom } = require("@hapi/boom");
const { exec } = require("child_process");

/* ================== FIX CRÍTICO ================== */
/* Crear carpeta de sesión si no existe */
const sessionDir = global.sessionName || "SonGokuBot_session";
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
  console.log("📁 Carpeta de sesión creada:", sessionDir);
}

/* ================== PROTECCIÓN BÁSICA ================== */
process.on("unhandledRejection", (err) => {
  console.log("❌ PROMISE NO CAPTURADA:", err?.message || err);
});

process.on("uncaughtException", (err) => {
  console.log("❌ EXCEPCIÓN NO CAPTURADA:", err?.message || err);
});

/* ================== LOGS ================== */
const print = (label, value) =>
  console.log(
    `${chalk.green.bold("║")} ${chalk.cyan.bold(label.padEnd(16))}${chalk.magenta.bold(":")} ${value}`,
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
  info: (msg) => console.log(chalk.bgBlue.white.bold("INFO"), chalk.white(msg)),
  success: (msg) =>
    console.log(chalk.bgGreen.white.bold("SUCCESS"), chalk.greenBright(msg)),
  warning: (msg) =>
    console.log(chalk.bgYellowBright.red.bold("WARNING"), chalk.yellow(msg)),
  error: (msg) =>
    console.log(chalk.bgRed.white.bold("ERROR"), chalk.redBright(msg)),
};

/* ================== SYSTEM INFO ================== */
const userInfoSyt = () => {
  try {
    return os.userInfo().username;
  } catch {
    return process.env.USER || process.env.USERNAME || "desconocido";
  }
};

console.log(
  chalk.yellow.bold(
    `╔═════[${chalk.yellowBright(userInfoSyt())}@${chalk.yellowBright(os.hostname())}]═════`,
  ),
);
print("OS", `${os.platform()} ${os.release()} ${os.arch()}`);
print(
  "Actividad",
  `${Math.floor(os.uptime() / 3600)} h ${Math.floor((os.uptime() % 3600) / 60)} m`,
);
print("CPU", os.cpus()[0]?.model || "unknown");
print(
  "Memoria",
  `${(os.freemem() / 1024 / 1024).toFixed(0)} MiB / ${(os.totalmem() / 1024 / 1024).toFixed(0)} MiB`,
);
print("Node.js", process.version);
print("Baileys", "WhiskeySockets");
console.log(chalk.yellow.bold("╚" + "═".repeat(40)));

/* ================== START BOT ================== */
async function startBot() {
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
  // 📱 Número desde variable de entorno (OBLIGATORIO en hosting)
  const phoneNumber = process.env.PAIRING_NUMBER;

  if (!phoneNumber) {
    log.error("❌ Define la variable PAIRING_NUMBER en el panel");
    log.error("Ejemplo: PAIRING_NUMBER=51999999999");
    process.exit(1);
  }

  try {
    const pairing = await client.requestPairingCode(
      phoneNumber,
      "SONGOKU1" // ← puedes cambiar este texto si quieres
    );

    log.success(`📲 Código de emparejamiento: ${pairing}`);
    log.info("Abre WhatsApp → Dispositivos vinculados → Vincular dispositivo");
  } catch (err) {
    log.error("❌ Error al emparejar");
    console.error(err);

    // Limpieza segura de sesión
    if (fs.existsSync(sessionDir)) {
      exec(`rm -rf ${sessionDir}`);
    }

    process.exit(1);
  }
}


  await global.loadDatabase();
  log.success("Base de datos cargada");

  client.sendText = (jid, text, quoted = "", options) =>
    client.sendMessage(jid, { text, ...options }, { quoted });

  /* ================== LIMPIEZA TMP ================== */
  const tmpDir = path.join(__dirname, "tmp");

  setInterval(async () => {
    try {
      if (!fs.existsSync(tmpDir)) return;
      for (const file of fs.readdirSync(tmpDir)) {
        const filePath = path.join(tmpDir, file);
        if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
      }
    } catch {}
  }, 15 * 60 * 1000);

  /* ================== CONNECTION ================== */
  client.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") log.success("Conectado correctamente");

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (
        reason === DisconnectReason.connectionLost ||
        reason === DisconnectReason.connectionClosed ||
        reason === DisconnectReason.restartRequired
      ) {
        startBot();
      } else if (reason === DisconnectReason.loggedOut) {
        exec(`rm -rf ${sessionDir}/*`);
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
      require("./main")(client, m, messages);
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

  client.ev.on("creds.update", saveCreds);
}

startBot();

/* ================== HOT RELOAD ================== */
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`Actualizado ${__filename}`));
  delete require.cache[file];
  require(file);
});

