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

/* ================== CARGAR COMANDOS ================== */
seeCommands()

/* ================== HANDLER PRINCIPAL ================== */
module.exports = async (client, m) => {
  let body = ""

  /* ================== LECTURA DE MENSAJE ================== */
  if (m?.message) {
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

  if (!body) return

  /* ================== INIT DB + ANTILINK ================== */
  try { initDB(m) } catch {}
  try { antilink(client, m) } catch {}

  /* ================== PREFIJO ================== */
  const prefixes = [".", "!", "#", "/"]
  const prefix = prefixes.find(p => body.startsWith(p))
  if (!prefix) return

  /* ================== DATOS BASE ================== */
  const from = m.key.remoteJid
  const args = body.trim().split(/ +/).slice(1)
  const text = args.join(" ")
  const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net"

  const command = body
    .slice(prefix.length)
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()

  const pushname = m.pushName || "Sin nombre"
  const sender = m.isGroup
    ? m.key.participant || m.participant
    : m.key.remoteJid

  /* ================== METADATA DE GRUPO ================== */
  let groupMetadata = null
  let groupAdmins = []
  let resolvedAdmins = []
  let groupName = ""

  if (m.isGroup) {
    try {
      groupMetadata = await client.groupMetadata(m.chat)
    } catch {
      groupMetadata = null
    }

    if (groupMetadata) {
      groupName = groupMetadata.subject || ""

      groupAdmins = groupMetadata.participants.filter(
        p => p.admin === "admin" || p.admin === "superadmin"
      )

      resolvedAdmins = await Promise.all(
        groupAdmins.map(async adm => {
          let realJid = adm.jid
          try {
            realJid = await resolveLidToRealJid(adm.jid, client, m.chat)
          } catch {}
          return { ...adm, jid: realJid }
        })
      )
    }
  }

  const isBotAdmins =
    m.isGroup && resolvedAdmins.length
      ? resolvedAdmins.some(p => p.jid === botJid)
      : false

  const isAdmins =
    m.isGroup && resolvedAdmins.length
      ? resolvedAdmins.some(p => p.jid === m.sender)
      : false

  /* ================== LOGS ESTÉTICOS ================== */
  const line = chalk.bold.blue("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  console.log(
    `\n${line}` +
    `\n📆 ${chalk.yellow(moment().format("DD/MM/YY HH:mm:ss"))}` +
    `\n👤 Usuario: ${chalk.whiteBright(pushname)}` +
    `\n📨 Remitente: ${gradient("deepskyblue", "violet")(sender)}` +
    (
      m.isGroup
        ? `\n👥 Grupo: ${chalk.greenBright(groupName)}`
        : `\n💬 Chat privado`
    ) +
    `\n${line}`
  )

  /* ================== EJECUCIÓN DE COMANDOS ================== */
  if (!global.comandos.has(command)) return

  const cmdData = global.comandos.get(command)
  if (!cmdData) return

  if (
    cmdData.isOwner &&
    !global.owner.map(num => num + "@s.whatsapp.net").includes(m.sender)
  ) return m.reply(mess.owner)

  if (cmdData.isReg && !db.data.users[m.sender]?.registered)
    return m.reply(mess.registered)

  if (cmdData.isGroup && !m.isGroup) return m.reply(mess.group)
  if (cmdData.isAdmin && !isAdmins) return m.reply(mess.admin)
  if (cmdData.isBotAdmin && !isBotAdmins) return m.reply(mess.botAdmin)
  if (cmdData.isPrivate && m.isGroup) return m.reply(mess.private)

  try {
    await cmdData.run(client, m, args, { text })
  } catch (error) {
    console.error(
      chalk.red(`❌ Error ejecutando comando: ${command}`),
      error
    )

    await client.sendMessage(
      m.chat,
      { text: "❌ Error al ejecutar el comando" },
      { quoted: m, ...global.channelInfo }
    )
  }
}

/* ================== HOT RELOAD ================== */
const mainFile = require.resolve(__filename)
fs.watchFile(mainFile, () => {
  fs.unwatchFile(mainFile)
  console.log(
    chalk.yellowBright(
      `♻️ ${path.basename(__filename)} actualizado, recargando...`
    )
  )
  delete require.cache[mainFile]
  require(mainFile)
})