/**
 * ================================
 *        Mini Lurus - WaBot
 * ================================
 * Creado por: Carlos Alexis (Zam)
 * Ajustado para SUBBOTS con CÓDIGO
 * Un solo MAIN para todos
 * ================================
 */

require("./settings")
require("./lib/database")

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  jidDecode,
  DisconnectReason,
} = require("@whiskeysockets/baileys")

const pino = require("pino")
const chalk = require("chalk")
const fs = require("fs")
const path = require("path")
const readline = require("readline")
const os = require("os")
const { smsg } = require("./lib/message")
const { Boom } = require("@hapi/boom")

// 🔹 IMPORTAMOS EL MAIN (ÚNICO PARA TODOS)
const mainHandler = require("./main")

/* ================== SESIÓN PRINCIPAL ================== */
const sessionDir = global.sessionName || "SonGokuBot_session"
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true })
}

/* ================== PROTECCIÓN ================== */
process.on("unhandledRejection", (e) =>
  console.log("❌ PROMISE NO CAPTURADA:", e?.message || e),
)
process.on("uncaughtException", (e) =>
  console.log("❌ EXCEPCIÓN NO CAPTURADA:", e?.message || e),
)

/* ================== UTILIDADES ================== */
const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) =>
    rl.question(text, (ans) => {
      rl.close()
      resolve(ans.trim())
    }),
  )
}

/* ================== START BOT ================== */
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir)
  const { version } = await fetchLatestBaileysVersion()

  const client = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    // ❌ NO browser
    // ❌ NO mobile
    // ❌ NO printQRInTerminal
  })

  /* ================== VINCULACIÓN PRINCIPAL ================== */
  if (!state.creds.registered) {
    let phone = process.env.PAIRING_NUMBER

    if (!phone) {
      phone = await question("📱 Ingresa tu número (ej: 51999999999): ")
    }

    try {
      const code = await client.requestPairingCode(phone)
      console.log(
        chalk.green.bold("🔐 Código de vinculación: "),
        chalk.white.bold(code),
      )
      console.log(
        chalk.cyan(
          "WhatsApp → Dispositivos vinculados → Vincular con código",
        ),
      )
    } catch (e) {
      console.error("❌ Error generando código", e)
      return
    }
  }

  await global.loadDatabase()
  console.log(chalk.green("✅ Base de datos cargada"))

  client.ev.on("creds.update", saveCreds)

  /* ================== CONEXIÓN ================== */
  client.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update

    if (connection === "open") {
      console.log(chalk.green("✅ Bot conectado"))
    }

    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        console.log(chalk.yellow("🔄 Reconectando..."))
        startBot()
      } else {
        console.log(
          chalk.red("❌ Sesión cerrada, elimina carpeta y vuelve a vincular"),
        )
      }
    }
  })

  /* ================== MENSAJES ================== */
  client.ev.on("messages.upsert", async ({ messages }) => {
    try {
      let m = messages[0]
      if (!m?.message) return
      if (m.key.remoteJid === "status@broadcast") return

      m = smsg(client, m)

      // 🔥 TODOS (bot + subbots) usan el MISMO MAIN
      await mainHandler(client, m)
    } catch (e) {
      console.error(e)
    }
  })

  client.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {}
      return decode.user && decode.server
        ? decode.user + "@" + decode.server
        : jid
    }
    return jid
  }
}

startBot()

/* ================== HOT RELOAD ================== */
const file = require.resolve(__filename)
fs.watchFile(file, () => {
  fs.unwatchFile(file)
  console.log(chalk.yellow("♻ index actualizado"))
  delete require.cache[file]
  require(file)
})