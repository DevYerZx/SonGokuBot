require("./settings");
require("./lib/database");

const {
  default: makeWASocket,
  makeInMemoryStore,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidDecode,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const chalk = require("chalk");
const fs = require("fs");
const readline = require("readline");
const os = require("os");
const { Boom } = require("@hapi/boom");
const { smsg } = require("./lib/message");
const { server, PORT } = require("./lib/server");
const welcome = require("./events/welcome");

const sessionDir = global.sessionName || "SonGokuBot_session";
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

process.on("unhandledRejection", (error) =>
  console.log("PROMISE NO CAPTURADA:", error?.message || error),
);
process.on("uncaughtException", (error) =>
  console.log("EXCEPCION NO CAPTURADA:", error?.message || error),
);

const print = (label, value, tone = "cyan") => {
  const color = chalk[tone] || chalk.cyan;
  console.log(
    `${chalk.hex("#ff8c42")("│")} ${chalk.gray(label.padEnd(14))} ${chalk.hex("#39c5bb")("•")} ${color(value)}`,
  );
};

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
    rl.question(text, (answer) => {
      rl.close();
      resolve(answer.trim());
    }),
  );
};

const safeUser = () => {
  try {
    return os.userInfo().username;
  } catch {
    return "container";
  }
};

function renderStartupBanner() {
  const banner = [
    "",
    chalk.hex("#ff8c42")("┌──────────────────────────────────────────────────────┐"),
    chalk.hex("#ff8c42")("│") +
      chalk.bold.hex("#f4efe7")("                  SonGokuBOT Runtime                  ") +
      chalk.hex("#ff8c42")("│"),
    chalk.hex("#ff8c42")("└──────────────────────────────────────────────────────┘"),
  ];

  console.log(banner.join("\n"));
  print("Usuario", `${safeUser()}@${os.hostname()}`, "white");
  print("Sistema", `${os.platform()} ${os.arch()}`, "green");
  print("Node", process.version, "yellow");
  print("Baileys", "WhiskeySockets", "magenta");
  print("API", global.api?.baseUrl || "No configurada", "cyan");
  print("Sesion", sessionDir, "white");
  print("Puerto", String(PORT), "green");
  console.log(chalk.hex("#39c5bb")("────────────────────────────────────────────────────────"));
}

renderStartupBanner();

const logger = pino({ level: "silent" });
const store = makeInMemoryStore({ logger });
const fatalDisconnectReasons = new Set([
  DisconnectReason.badSession,
  DisconnectReason.connectionReplaced,
  DisconnectReason.loggedOut,
  DisconnectReason.multideviceMismatch,
]);

let clientInstance = null;
let isStarting = false;
let reconnectTimer = null;
let reconnectAttempts = 0;
let shuttingDown = false;

global.__songoku_runtime = {
  startedAt: Date.now(),
  connectionState: "starting",
  reconnectAttempts: 0,
  sessionDir,
  port: Number(PORT),
};

function sanitizePhoneNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function getReconnectDelay() {
  const baseDelay = 3000;
  const attemptFactor = Math.max(reconnectAttempts, 1);
  return Math.min(baseDelay * attemptFactor, 30000);
}

function startHttpServer() {
  if (global.__songoku_http_started) return;

  global.__songoku_http_started = true;

  server.on("error", (error) => {
    if (error?.code === "EADDRINUSE") {
      global.__songoku_runtime.httpState = "port-in-use";
      log.warning(`Puerto ${PORT} ya esta en uso, se omite el servidor HTTP.`);
      return;
    }

    global.__songoku_runtime.httpState = "error";
    log.warning(`Servidor HTTP: ${error?.message || error}`);
  });

  server.listen(PORT, () => {
    global.__songoku_runtime.httpState = "listening";
    log.info(`Servidor HTTP activo en el puerto ${PORT}`);
  });
}

function scheduleReconnect(reasonLabel = "desconocido") {
  if (shuttingDown || reconnectTimer) return;

  reconnectAttempts += 1;
  global.__songoku_runtime.reconnectAttempts = reconnectAttempts;
  global.__songoku_runtime.connectionState = "reconnecting";
  global.__songoku_runtime.lastDisconnectReason = reasonLabel;
  const delayMs = getReconnectDelay();

  log.warning(
    `Conexion cerrada (${reasonLabel}). Reintentando en ${Math.ceil(delayMs / 1000)}s...`,
  );

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    startBot().catch((error) => {
      log.error(`Reconexion fallida: ${error?.message || error}`);
    });
  }, delayMs);
}

async function requestPairingCode(client, state) {
  if (state.creds.registered) return;

  let phone = sanitizePhoneNumber(process.env.PAIRING_NUMBER);

  if (!phone) {
    phone = sanitizePhoneNumber(
      await question("Ingresa tu numero (ej: 51999999999): "),
    );
  }

  if (!phone || phone.length < 8) {
    throw new Error("Numero invalido para el pairing code.");
  }

  const code = await client.requestPairingCode(phone);
  global.__songoku_runtime.connectionState = "pairing";
  log.success(`Codigo de emparejamiento: ${code}`);
  log.info("WhatsApp > Dispositivos vinculados > Vincular un dispositivo");
}

async function startBot() {
  if (isStarting) return clientInstance;

  isStarting = true;

  try {
    startHttpServer();

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
      version,
      logger,
      auth: state,
      browser: ["Windows", "Chrome", "122.0.0.0"],
      markOnlineOnConnect: false,
      syncFullHistory: false,
      fireInitQueries: true,
      defaultQueryTimeoutMs: 60000,
      generateHighQualityLinkPreview: false,
    });

    client.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        const decode = jidDecode(jid) || {};
        return decode.user && decode.server
          ? `${decode.user}@${decode.server}`
          : jid;
      }
      return jid;
    };

    clientInstance = client;
    store.bind(client.ev);

    await requestPairingCode(client, state);
    await global.loadDatabase();
    log.success("Base de datos cargada");

    client.ev.on("creds.update", saveCreds);

    client.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === "connecting") {
        global.__songoku_runtime.connectionState = "connecting";
        log.info("Conectando con WhatsApp...");
      }

      if (connection === "open") {
        reconnectAttempts = 0;
        global.__songoku_runtime.connectionState = "open";
        global.__songoku_runtime.reconnectAttempts = 0;
        log.success("Conexion abierta correctamente");
      }

      if (connection !== "close") return;

      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const reasonLabel = lastDisconnect?.error?.message || `code:${reason || "unknown"}`;
      global.__songoku_runtime.lastDisconnectReason = reasonLabel;

      if (fatalDisconnectReasons.has(reason)) {
        global.__songoku_runtime.connectionState = "closed";
        if (reason === DisconnectReason.loggedOut) {
          log.error("Sesion cerrada. Borra la carpeta de sesion y vuelve a vincular.");
        } else {
          log.error(`Conexion finalizada sin reconexion automatica: ${reasonLabel}`);
        }
        return;
      }

      if (reason === DisconnectReason.restartRequired) {
        log.warning("WhatsApp pidio reiniciar la conexion.");
      }

      scheduleReconnect(reasonLabel);
    });

    client.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type && type !== "notify") return;

      try {
        let m = messages?.[0];
        if (!m?.message) return;
        if (m.key?.remoteJid === "status@broadcast") return;

        m = smsg(client, m, store);
        await require("./main")(client, m);
      } catch (error) {
        console.log(error);
      }
    });

    client.ev.on("group-participants.update", async (update) => {
      try {
        await welcome(update, client);
      } catch (error) {
        log.warning(`Welcome handler: ${error?.message || error}`);
      }
    });

    return client;
  } finally {
    isStarting = false;
  }
}

process.on("SIGINT", async () => {
  shuttingDown = true;
  global.__songoku_runtime.connectionState = "stopping";
  if (reconnectTimer) clearTimeout(reconnectTimer);
  try {
    await clientInstance?.ws?.close?.();
  } finally {
    process.exit(0);
  }
});

process.on("SIGTERM", async () => {
  shuttingDown = true;
  global.__songoku_runtime.connectionState = "stopping";
  if (reconnectTimer) clearTimeout(reconnectTimer);
  try {
    await clientInstance?.ws?.close?.();
  } finally {
    process.exit(0);
  }
});

startBot().catch((error) => {
  global.__songoku_runtime.connectionState = "error";
  global.__songoku_runtime.lastDisconnectReason = error?.message || "inicio";
  log.error(`No se pudo iniciar el bot: ${error?.message || error}`);
  scheduleReconnect(error?.message || "inicio");
});

const file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.yellow("Index actualizado"));
  delete require.cache[file];
  require(file);
});
