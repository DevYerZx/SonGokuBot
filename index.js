/**
 * ================================
 *        Mini Lurus - WaBot
 * ================================
 * Creado por: Carlos Alexis (Zam)
 * Año: 2025
 * Librería: Baileys
 * 
 * Nota: No borres los créditos, ni te pongas
 * créditos que no son tuyos, respeta el trabajo.
 * ================================
 **/

require("./settings");
require("./lib/database");
const {
  default: makeWASocket,
  makeCacheableSignalKeyStore,
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
const qrcode = require("qrcode-terminal");
const parsePhoneNumber = require("awesome-phonenumber");
const { smsg } = require("./lib/message");
const { app, server } = require("./lib/server");
const { Boom } = require("@hapi/boom");
const { exec } = require("child_process");

const print = (label, value) =>
  console.log(
    `${chalk.green.bold("║")} ${chalk.cyan.bold(label.padEnd(16))}${chalk.magenta.bold(":")} ${value}`,
  );

const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
};

const usePairingCode = true;

const log = {
  info: (msg) => console.log(chalk.bgBlue.white.bold(`INFO`), chalk.white(msg)),
  success: (msg) =>
    console.log(chalk.bgGreen.white.bold(`SUCCESS`), chalk.greenBright(msg)),
  warn: (msg) =>
    console.log(
      chalk.bgYellowBright.blueBright.bold(`WARNING`),
      chalk.yellow(msg),
    ),
  warning: (msg) =>
    console.log(chalk.bgYellowBright.red.bold(`WARNING`), chalk.yellow(msg)),
  error: (msg) =>
    console.log(chalk.bgRed.white.bold(`ERROR`), chalk.redBright(msg)),
};

const userInfoSyt = () => {
  try {
    return os.userInfo().username;
  } catch (e) {
    return process.env.USER || process.env.USERNAME || "desconocido";
  }
};

console.log(
  chalk.yellow.bold(
    `╔═════[${`${chalk.yellowBright(userInfoSyt())}${chalk.white.bold("@")}${chalk.yellowBright(os.hostname())}`}]═════`,
  ),
);
print("OS", `${os.platform()} ${os.release()} ${os.arch()}`);
print(
  "Actividad",
  `${Math.floor(os.uptime() / 3600)} h ${Math.floor((os.uptime() % 3600) / 60)} m`,
);
print("Shell", process.env.SHELL || process.env.COMSPEC || "desconocido");
print("CPU", os.cpus()[0]?.model.trim() || "unknown");
print(
  "Memoria",
  `${(os.freemem() / 1024 / 1024).toFixed(0)} MiB / ${(os.totalmem() / 1024 / 1024).toFixed(0)} MiB`,
);
print("Script version", `v${require("./package.json").version}`);
print("Node.js", process.version);
print("Baileys", `WhiskeySockets/baileys`);
print(
  "Fecha & Tiempo",
  new Date().toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    hour12: false,
  }),
);
console.log(chalk.yellow.bold("╚" + "═".repeat(30)));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
  const { version } = await fetchLatestBaileysVersion();

  console.info = () => {};
  console.debug = () => {};

  const client = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Linux", "Opera"],
    auth: state,
  });

  if (!client.authState.creds.registered) {
    const phoneNumber = await question(
      log.warn("Ingrese su número de WhatsApp\n") +
        log.info("Ejemplo: 519566666\n"),
    );
    try {
      log.info("Solicitando código de emparejamiento...");
      const pairing = await client.requestPairingCode(phoneNumber, "SONGOKU1");
      log.success(
        `Código de emparejamiento: ${chalk.cyanBright(pairing)} (expira en 15s)`,
      );
    } catch (err) {
      log.error("Error al solicitar el código de emparejamiento:", err);
      exec("rm -rf ./SonGokuBot_session/*");
      process.exit(1);
    }
  }

  await global.loadDatabase();
  console.log(chalk.yellow("Base de datos cargada correctamente."));

  client.sendText = (jid, text, quoted = "", options) =>
    client.sendMessage(jid, { text, ...options }, { quoted });

  // =====================================================
  // 🧹 LIMPIEZA AUTOMÁTICA TMP + NOTIFICACIÓN (AGREGADO)
  // Cada 15 minutos
  // =====================================================
  const tmpDir = path.join(__dirname, "tmp");

  setInterval(async () => {
    try {
      if (!fs.existsSync(tmpDir)) return;

      let deleted = 0;

      fs.readdirSync(tmpDir).forEach(file => {
        const filePath = path.join(tmpDir, file);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      });

      if (deleted === 0) return;

      const groups = await client.groupFetchAllParticipating();
      const text = `🧹 *Mantenimiento automático*\n\nSe limpiaron *${deleted}* archivos temporales (tmp)\n⏰ Proceso automático cada 15 minutos`;

      for (const id of Object.keys(groups)) {
        await client.sendMessage(id, { text });
      }

      console.log(chalk.cyanBright(`🧹 TMP limpiado (${deleted} archivos)`));
    } catch (err) {
      console.log(chalk.red("Error limpieza TMP:"), err.message);
    }
  }, 15 * 60 * 1000);
  // =====================================================

  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (
        reason === DisconnectReason.connectionLost ||
        reason === DisconnectReason.connectionClosed ||
        reason === DisconnectReason.restartRequired ||
        reason === DisconnectReason.timedOut
      ) {
        startBot();
      } else if (
        reason === DisconnectReason.loggedOut ||
        reason === DisconnectReason.forbidden
      ) {
        exec("rm -rf ./lurus_session/*");
        process.exit(1);
      }
    }
    if (connection === "open") {
      log.success("Su conexión fue exitosa");
    }
  });

  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      let m = messages[0];
      if (!m.message) return;
      m.message =
        Object.keys(m.message)[0] === "ephemeralMessage"
          ? m.message.ephemeralMessage.message
          : m.message;
      if (m.key && m.key.remoteJid === "status@broadcast") return;
      m = smsg(client, m);
      require("./main")(client, m, messages);
    } catch (err) {
      console.log(err);
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

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellowBright(`Se actualizo el archivo ${__filename}`));
  delete require.cache[file];
  require(file);
});