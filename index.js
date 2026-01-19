/**
 * ================================
 *        Mini Lurus - WaBot
 * ================================
 * Creado por: Carlos Alexis (Zam)
 * Año: 2025
 * Librería: Baileys
 * Nota: No borres los créditos, ni te pongas
 * créditos que no son tuyos, respeta el trabajo.
 * ================================
 **/
/**
**mejorando DvYer (autoEliminacion de archivos basuras como tmp**/

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
  return new Promise((resolve) => rl.question(text, resolve));
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
  const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
  const { version } = await fetchLatestBaileysVersion();

  const client = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["Linux", "Opera"],
  });

  /* ================== AUTH ================== */
  if (!client.authState.creds.registered) {
    const phoneNumber = await question("📱 Ingresa tu número (ej: 519999999): ");
    try {
      const pairing = await client.requestPairingCode(phoneNumber, "SONGOKU1");
      log.success(`Código de emparejamiento: ${pairing}`);
    } catch (err) {
      log.error("Error al emparejar");
      exec("rm -rf ./SonGokuBot_session/*");
      process.exit(1);
    }
  }

  await global.loadDatabase();
  log.success("Base de datos cargada");

  client.sendText = (jid, text, quoted = "", options) =>
    client.sendMessage(jid, { text, ...options }, { quoted });

  /* =====================================================
     🧹 LIMPIEZA GLOBAL PREVENTIVA TMP (CADA 15 MIN)
     - Borra archivos temporales
     - Notifica a todos los grupos
     ===================================================== */
  const tmpDir = path.join(__dirname, "tmp");

  setInterval(async () => {
    try {
      if (!fs.existsSync(tmpDir)) return;

      const files = fs.readdirSync(tmpDir);
      if (!files.length) return;

      let deleted = 0;
      for (const file of files) {
        const filePath = path.join(tmpDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      }

      if (deleted === 0) return;

      const groups = await client.groupFetchAllParticipating();
      const msg = `🧹 *Mantenimiento automático*\n\n✅ Archivos temporales eliminados: *${deleted}*\n⏰ Frecuencia: cada 15 minutos\n🤖 SonGokuBot`;

      for (const id of Object.keys(groups)) {
        await client.sendMessage(id, { text: msg });
      }

      console.log(chalk.cyanBright(`TMP limpiado: ${deleted} archivos`));
    } catch (e) {
      console.log(chalk.red("Error en limpieza TMP:"), e.message);
    }
  }, 15 * 60 * 1000);

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
        startBot();
      } else if (reason === DisconnectReason.loggedOut) {
        exec("rm -rf ./lurus_session/*");
        process.exit(1);
      }
    }
    if (connection === "open") log.success("Conectado correctamente");
  });

  /* ================== MESSAGES ================== */
  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      let m = messages[0];
      if (!m.message) return;
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