/* ================== CARGA SETTINGS ================== */
require("./settings")

const fs = require("fs")
const path = require("path")
const moment = require("moment")
const chalk = require("chalk")
const gradient = require("gradient-string")

const seeCommands = require("./lib/system/commandLoader")
const initDB = require("./lib/system/initDB")
const antilink = require("./commands/antilink")
const { resolveLidToRealJid } = require("./lib/utils")

/* ================== PROTECCIÓN GLOBAL ================== */
process.on("unhandledRejection", (r) =>
  console.log("❌ PROMISE:", r?.message || r)
)
process.on("uncaughtException", (e) =>
  console.log("❌ EXCEPCIÓN:", e.message)
)

/* ================== TIMEOUT UTIL ================== */
const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, r) =>
      setTimeout(() => r(new Error("Timed Out")), ms)
    ),
  ])

/* ================== ANTI PRIVADO DB ================== */
const antiPath = path.join(__dirname, "./database/antiprivado.json")

if (!fs.existsSync(antiPath)) {
  fs.writeFileSync(antiPath, JSON.stringify({ intentos: [] }, null, 2))
}

// cache en memoria (rápido)
const antiCache = new Set(
  JSON.parse(fs.readFileSync(antiPath)).intentos.map(x => x.numero)
)

/* ================== CARGAR COMANDOS ================== */
seeCommands()

/* ================== HANDLER PRINCIPAL ================== */
module.exports = async (client, m) => {
  try {
    if (!m?.key) return

    const from = m.key.remoteJid
    const senderJid = m.key.participant || m.key.remoteJid
    const senderNum = senderJid.split("@")[0]
    const isGroup = from.endsWith("@g.us")
    const isOwner = global.owner.includes(senderNum)

    /* ================== ANTI PRIVADO SEGURO ================== */
    if (!isGroup && global.antiPrivado && !isOwner) {

      // ya fue avisado → salir sin hacer nada
      if (antiCache.has(senderJid)) return

      antiCache.add(senderJid)

      const db = JSON.parse(fs.readFileSync(antiPath))
      db.intentos.push({
        numero: senderJid,
        fecha: new Date().toLocaleString(),
      })
      fs.writeFileSync(antiPath, JSON.stringify(db, null, 2))

      try {
        await withTimeout(
          client.sendMessage(from, {
            text:
              "🚫 *Este bot no responde mensajes privados*\n\n" +
              "👉 Únete al *grupo oficial*:\n" +
              global.grupoOficial,
          }),
          8000
        )
      } catch {
        console.log("⚠️ Aviso AntiPrivado falló")
      }
      return
    }

    /* ================== LEER MENSAJE ================== */
    let body =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      m.message?.buttonsResponseMessage?.selectedButtonId ||
      m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      m.message?.templateButtonReplyMessage?.selectedId ||
      ""

    body = body.trim()
    if (!body) return

    /* ================== INIT DB + ANTILINK ================== */
    try { initDB(m) } catch {}
    try { antilink(client, m) } catch {}

    /* ================== PREFIJO ================== */
    const prefixes = [".", "!", "#", "/"]
    if (!prefixes.includes(body[0])) return

    const args = body.slice(1).trim().split(/ +/)
    const command = args.shift()?.toLowerCase()
    const text = args.join(" ")

    if (!global.comandos.has(command)) return

    /* ================== METADATA GRUPO ================== */
    let admins = []
    let groupName = ""

    if (m.isGroup) {
      try {
        const meta = await withTimeout(client.groupMetadata(m.chat), 8000)
        groupName = meta.subject || ""
        admins = await Promise.all(
          meta.participants
            .filter(p => p.admin)
            .map(async a => ({
              ...a,
              jid: await resolveLidToRealJid(a.jid, client, m.chat).catch(() => a.jid)
            }))
        )
      } catch {}
    }

    const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net"
    const isBotAdmin = admins.some(a => a.jid === botJid)
    const isAdmin = admins.some(a => a.jid === senderJid)

    /* ================== LOG ================== */
    console.log(
      chalk.blue("\n━━━━━━━━━━━━━━━━━━━━") +
      `\n📆 ${moment().format("DD/MM/YY HH:mm:ss")}` +
      `\n👤 ${m.pushName || "Sin nombre"}` +
      `\n💬 ${m.isGroup ? groupName : "Privado"}` +
      chalk.blue("\n━━━━━━━━━━━━━━━━━━━━")
    )

    /* ================== EJECUTAR COMANDO ================== */
    const cmd = global.comandos.get(command)

    if (cmd.isOwner && !isOwner) return m.reply(mess.owner)
    if (cmd.isGroup && !m.isGroup) return m.reply(mess.group)
    if (cmd.isAdmin && !isAdmin) return m.reply(mess.admin)
    if (cmd.isBotAdmin && !isBotAdmin) return m.reply(mess.botAdmin)

    await withTimeout(
      cmd.run(client, m, args, { text }),
      20000
    )

  } catch (e) {
    console.log("❌ ERROR GENERAL:", e.message)
  }
}

/* ================== HOT RELOAD ================== */
const mainFile = require.resolve(__filename)
fs.watchFile(mainFile, () => {
  fs.unwatchFile(mainFile)
  console.log(gradient.rainbow("♻️ Main recargado"))
  delete require.cache[mainFile]
  require(mainFile)
})
