require("./settings");
const fs = require("fs");
const path = require("path");
const moment = require("moment");
const chalk = require("chalk");
const gradient = require("gradient-string");
const seeCommands = require("./lib/system/commandLoader");
const initDB = require("./lib/system/initDB");
const antilink = require("./commands/antilink");
const { resolveLidToRealJid } = require("./lib/utils");

/* ================== ANTI PRIVADO DB ================== */
const antiPath = path.join(__dirname, "./database/antiprivado.json");

if (!fs.existsSync(antiPath)) {
  fs.writeFileSync(
    antiPath,
    JSON.stringify({ intentos: [] }, null, 2)
  );
}

seeCommands();

module.exports = async (client, m) => {
  let body = "";

  /* ================== ANTI PRIVADO ================== */
  const from = m.key.remoteJid;
  const senderJid = m.key.participant || m.key.remoteJid;
  const senderNum = senderJid.split("@")[0];
  const isGroup = from.endsWith("@g.us");
  const isOwner = global.owner.includes(senderNum);

  if (!isGroup && global.antiPrivado && !isOwner) {
    const data = JSON.parse(fs.readFileSync(antiPath));

    data.intentos.push({
      numero: senderJid,
      fecha: new Date().toLocaleString(),
    });

    fs.writeFileSync(antiPath, JSON.stringify(data, null, 2));

    // 📩 mensaje + grupo
    await client.sendMessage(
      from,
      {
        text:
          "🚫 *Este bot no responde mensajes privados*\n\n" +
          "👉 Únete al *grupo oficial* para usar el bot:\n" +
          global.grupoOficial
      },
      global.channelInfo
    );

    // ⛔ bloquear usuario (SIN DESBLOQUEO)
    await client.updateBlockStatus(senderJid, "block");

    return;
  }
  /* ================== FIN ANTI PRIVADO ================== */

  /* ================== LEER MENSAJE ================== */
  if (m.message) {
    if (m.message.conversation) body = m.message.conversation;
    else if (m.message.extendedTextMessage?.text)
      body = m.message.extendedTextMessage.text;
    else if (m.message.imageMessage?.caption)
      body = m.message.imageMessage.caption;
    else if (m.message.videoMessage?.caption)
      body = m.message.videoMessage.caption;
    else if (m.message.buttonsResponseMessage?.selectedButtonId)
      body = m.message.buttonsResponseMessage.selectedButtonId;
    else if (m.message.listResponseMessage?.singleSelectReply?.selectedRowId)
      body = m.message.listResponseMessage.singleSelectReply.selectedRowId;
    else if (m.message.templateButtonReplyMessage?.selectedId)
      body = m.message.templateButtonReplyMessage.selectedId;
  }

  initDB(m);
  antilink(client, m);

  const prefa = [".", "!", "#", "/"];
  const prefix = prefa.find((p) => body.startsWith(p));
  if (!prefix) return;

  const args = body.trim().split(/ +/).slice(1);
  const text = args.join(" ");
  const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net";

  const command = body
    .slice(prefix.length)
    .trim()
    .split(/\s+/)[0]
    .toLowerCase();

  const pushname = m.pushName || "Sin nombre";
  const sender = m.isGroup
    ? m.key.participant || m.participant
    : m.key.remoteJid;

  let groupMetadata = null;
  let resolvedAdmins = [];
  let groupName = "";

  /* ================== METADATA GRUPO ================== */
  if (m.isGroup) {
    try {
      groupMetadata = await client.groupMetadata(m.chat);
    } catch {}

    if (groupMetadata) {
      groupName = groupMetadata.subject || "";

      const admins = groupMetadata.participants.filter(
        (p) => p.admin
      );

      resolvedAdmins = await Promise.all(
        admins.map(async (adm) => {
          let jid = adm.jid;
          try {
            jid = await resolveLidToRealJid(adm.jid, client, m.chat);
          } catch {}
          return { ...adm, jid };
        })
      );
    }
  }

  const isBotAdmins =
    m.isGroup && resolvedAdmins.some((p) => p.jid === botJid);

  const isAdmins =
    m.isGroup && resolvedAdmins.some((p) => p.jid === m.sender);

  /* ================== LOG ================== */
  const h = chalk.bold.blue("************************************");
  const v = chalk.bold.white("*");

  console.log(
    `\n${h}` +
    `\n${v} Fecha: ${moment().format("DD/MM/YY HH:mm:ss")}` +
    `\n${v} Usuario: ${pushname}` +
    `\n${v} Remitente: ${sender}` +
    (m.isGroup
      ? `\n${v} Grupo: ${groupName}`
      : `\n${v} Chat privado`) +
    `\n${h}`
  );

  /* ================== COMANDOS ================== */
  if (global.comandos.has(command)) {
    const cmd = global.comandos.get(command);

    if (cmd.isOwner && !global.owner.includes(senderNum))
      return m.reply(mess.owner);

    if (cmd.isGroup && !m.isGroup) return m.reply(mess.group);
    if (cmd.isAdmin && !isAdmins) return m.reply(mess.admin);
    if (cmd.isBotAdmin && !isBotAdmins) return m.reply(mess.botAdmin);

    try {
      await cmd.run(client, m, args, { text });
    } catch (e) {
      console.error(e);
      await client.sendMessage(
        m.chat,
        { text: "❌ Error al ejecutar el comando" },
        { quoted: m, ...global.channelInfo }
      );
    }
  }
};

/* ================== HOT RELOAD ================== */
const mainFile = require.resolve(__filename);
fs.watchFile(mainFile, () => {
  fs.unwatchFile(mainFile);
  console.log("♻️ Main recargado");
  delete require.cache[mainFile];
  require(mainFile);
});
