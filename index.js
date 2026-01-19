/**
 * ================================
 *        Mini Lurus - WaBot
 * ================================
 * Creado por: Carlos Alexis (Zam)
 * Año: 2025
 * Librería: Baileys
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

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(global.sessionName);
  const { version } = await fetchLatestBaileysVersion();

  const client = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["Linux", "Opera"],
  });

  await global.loadDatabase();

  // ======================================
  // 🧹 LIMPIEZA AUTOMÁTICA TMP + NOTIFICACIÓN
  // Cada 15 minutos
  // ======================================
  const tmpDir = path.join(__dirname, "tmp");

  setInterval(async () => {
    try {
      if (!fs.existsSync(tmpDir)) return;

      let deleted = 0;

      fs.readdirSync(tmpDir).forEach(file => {
        const filePath = path.join(tmpDir, file);
        if (fs.statSync(filePath).isFile()) {
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
    } catch (e) {
      console.log(chalk.red("Error limpieza TMP:"), e.message);
    }
  }, 15 * 60 * 1000); // ⏰ 15 minutos

  // ======================================

  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      log.warning("Conexión cerrada, reiniciando...");
      startBot();
    }
    if (connection === "open") {
      log.success("Bot conectado correctamente");
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