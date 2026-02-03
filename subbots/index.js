const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const Pino = require("pino");
const path = require("path");
const handler = require("../main");

async function startSubBot(phone) {
  const id = phone;
  const sessionPath = path.join(__dirname, "sessions", id);

  const { state, saveCreds } =
    await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  // 🔐 PEDIR CÓDIGO DE VINCULACIÓN
  const code = await sock.requestPairingCode(phone);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log(`✅ SubBot ${phone} conectado`);
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        startSubBot(phone);
      }
    }
  });

  // 🔥 MISMO CÓDIGO, MISMOS COMANDOS
  handler(sock);

  return code;
}

module.exports = { startSubBot };