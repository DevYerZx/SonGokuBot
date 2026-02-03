const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys")
const Pino = require("pino")
const path = require("path")

// 👇 IMPORTAMOS TU MAIN
const mainHandler = require("../main")

async function createSubBot(phone) {
  const sessionPath = path.join(__dirname, "sessions", phone)

  const { state, saveCreds } =
    await useMultiFileAuthState(sessionPath)

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: "silent" })
  })

  sock.ev.on("creds.update", saveCreds)

  // 🔐 CÓDIGO DE VINCULACIÓN (NO QR)
  const code = await sock.requestPairingCode(phone)

  // 👇 MISMO HANDLER = MISMOS COMANDOS
  sock.ev.on("messages.upsert", async (msg) => {
    const m = msg.messages[0]
    if (!m?.message) return
    await mainHandler(sock, m)
  })

  return code
}

module.exports = { createSubBot }