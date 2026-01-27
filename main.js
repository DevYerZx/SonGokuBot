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
process.on("unhandledRejection", (reason) => {
  console.log("❌ PROMISE NO CAPTURADA:", reason?.message || reason)
})

process.on("uncaughtException", (err) => {
  console.log("❌ EXCEPCIÓN NO CAPTURADA:", err.message)
})

/* ================== TIMEOUT SEGURO ================== */
const withTimeout = (promise, ms = 15000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timed Out")), ms)
    ),
  ])

/* ================== ANTI PRIVADO DB ================== */
const antiPath = path.join(__dirname, "./database/antiprivado.json")

if (!fs.existsSync(antiPath)) {
  fs.writeFileSync(
    antiPath,
    JSON.stringify({ intentos: [] }, null, 2)
  )
}

let antiData = JSON.parse(fs.readFileSync(antiPath))

/* ================== CARGAR COMANDOS ================== */
seeCommands()

/* ================== HANDLER PRINCIPAL ================== */
module.exports = async (client, m) => {
  try {
    if (!m?.key) return

    let body = ""

    const from = m.key.remoteJid
    const senderJid = m.key.participant || m.key.remoteJid
    const senderNum = senderJid.split("@")[0]
    const isGroup = from.endsWith("@g.us")
    const isOwner = global.owner.includes(senderNum)

    /* ================== ANTI PRIVADO ================== */
    if (!isGroup && global.antiPrivado && !isOwner) {
      try {
        antiData.intentos.push({
          numero: senderJid,
          fecha: new Date().toLocaleString(),
        })

        fs.writeFileSync(antiPath, JSON.stringify(antiData, null, 2))

        await withTimeout(
          client.sendMessage(
            from,
            {
              text:
                "🚫 *Este bot no responde mensajes privados*\n\n" +
                "👉 Únete al *grupo oficial*:\n" +
                global.grupoOficial,
            },
            global.channelInfo
          )
        )

        await withTimeout(
          client.updateBlockStatus(senderJid, "block")
        )
      } catch (e) {
        console.log("⚠️ AntiPrivado error:", e.message)
      }
      return
    }

    /* ================== LEER MENSAJE ================== */
    if (m.message) {
      body =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption ||
        m.message.buttonsResponseMessage?.selectedButtonId ||
        m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        m.message.templateButtonReplyMessage?.selectedId ||
        ""
    }

    body = body.trim()
    if (!body) return

    /* ================== DB Y ANTILINK ================== */
    try { initDB(m) } catch {}
    try { antilink(client, m) } catch {}

    /* ================== PREFIJO ================== */
    const prefixes = [".", "!", "#", "/"]
    const prefix = body[0]
    if (!prefixes.includes(prefix)) return

    const args = body.slice(1).trim().split(/ +/)
    const command = args.shift()?.toLowerCase()
    const text = args.join(" ")

    if (!global.comandos.has(command)) return

    const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net"
    const sender = m.isGroup
      ? m.key.participant
      : m.key.remoteJid

    /* ================== METADATA GRUPO ================== */
    let resolvedAdmins = []
    let groupName = ""

    if (m.isGroup) {
      try {
        const meta = await withTimeout(
          client.groupMetadata(m.chat),
          10000
        )

        groupName = meta.subject || ""

        resolvedAdmins = await Promise.all(
          meta.participants
            .filter(p => p.admin)
            .map(async (adm) => {
              let jid = adm.jid
              try {
                jid = await resolveLidToRealJid(adm.jid, client, m.chat)
              } catch {}
              return { ...adm, jid }
            })
        )
      } catch (e) {
        console.log("⚠️ groupMetadata timeout")
      }
    }

    const isBotAdmins =
      m.isGroup && resolvedAdmins.some(p => p.jid === botJid)

    const isAdmins =
      m.isGroup && resolvedAdmins.some(p => p.jid === sender)

    /* ================== LOG ================== */
    console.log(
      chalk.blue("\n━━━━━━━━━━━━━━━━━━━━") +
      `\n📆 ${moment().format("DD/MM/YY HH:mm:ss")}` +
      `\n👤 Usuario: ${m.pushName || "Sin nombre"}` +
      `\n💬 Chat: ${m.isGroup ? groupName : "Privado"}` +
      chalk.blue("\n━━━━━━━━━━━━━━━━━━━━")
    )

    /* ================== EJECUTAR COMANDO ================== */
    const cmd = global.comandos.get(command)
    if (!cmd?.run) return

    if (cmd.isOwner && !isOwner) return m.reply(mess.owner)
    if (cmd.isGroup && !m.isGroup) return m.reply(mess.group)
    if (cmd.isAdmin && !isAdmins) return m.reply(mess.admin)
    if (cmd.isBotAdmin && !isBotAdmins) return m.reply(mess.botAdmin)

    try {
      await withTimeout(
        cmd.run(client, m, args, { text }),
        20000
      )
    } catch (e) {
      console.log("❌ ERROR COMANDO:", e.message)
      await client.sendMessage(
        m.chat,
        { text: "❌ Error al ejecutar el comando" },
        { quoted: m }
      )
    }

  } catch (err) {
    console.log("❌ ERROR GENERAL:", err.message)
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


