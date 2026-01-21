/**
 * ================================
 *        SonGokuBot - MAIN
 * ================================
 * Mejorado y blindado por: DvYer
 * Compatible: Node v20 + Baileys
 * ================================
 */

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

/* ================== LOAD COMMANDS (ONCE) ================== */
if (!global.__commandsLoaded) {
  seeCommands();
  global.__commandsLoaded = true;
}

/* ================== MAIN HANDLER ================== */
module.exports = async (client, m) => {
  try {
    if (!m || !m.message) return;

    let body = "";

    const msg = m.message;
    body =
      msg.conversation ||
      msg.extendedTextMessage?.text ||
      msg.imageMessage?.caption ||
      msg.videoMessage?.caption ||
      msg.buttonsResponseMessage?.selectedButtonId ||
      msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.templateButtonReplyMessage?.selectedId ||
      "";

    /* ================== DB & SECURITY ================== */
    try {
      initDB(m);
      antilink(client, m);
    } catch (e) {
      console.error("DB/Antilink error:", e);
    }

    /* ================== PREFIX ================== */
    const prefixes = [".", "!", "#", "/"];
    const prefix = prefixes.find(p => body.startsWith(p));
    if (!prefix) return;

    const from = m.chat;
    const args = body.trim().split(/\s+/).slice(1);
    const text = args.join(" ");

    const command = body
      .slice(prefix.length)
      .trim()
      .split(/\s+/)[0]
      .toLowerCase();

    const pushname = m.pushName || "Sin nombre";
    const sender = m.isGroup ? m.sender : m.chat;

    /* ================== GROUP DATA (SAFE) ================== */
    let groupMetadata = null;
    let groupAdmins = [];
    let resolvedAdmins = [];
    let groupName = "";

    if (m.isGroup) {
      try {
        groupMetadata = await client.groupMetadata(m.chat);
        groupName = groupMetadata.subject || "";

        groupAdmins = groupMetadata.participants.filter(
          p => p.admin === "admin" || p.admin === "superadmin",
        );

        resolvedAdmins = await Promise.all(
          groupAdmins.map(async adm => {
            try {
              const real = await resolveLidToRealJid(adm.id, client, m.chat);
              return { ...adm, jid: real };
            } catch {
              return { ...adm, jid: adm.id };
            }
          }),
        );
      } catch (e) {
        console.log("No se pudo obtener metadata del grupo");
      }
    }

    const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net";

    const isBotAdmins =
      m.isGroup && resolvedAdmins.some(p => p.jid === botJid);

    const isAdmins =
      m.isGroup && resolvedAdmins.some(p => p.jid === sender);

    /* ================== LOG ================== */
    const h = chalk.bold.blue("************************************");
    const v = chalk.bold.white("*");

    console.log(
      `\n${h}` +
        `\n${v} Fecha: ${moment().format("DD/MM/YY HH:mm:ss")}` +
        `\n${v} Usuario: ${pushname}` +
        `\n${v} Remitente: ${sender}` +
        (m.isGroup
          ? `\n${v} Grupo: ${groupName}\n${v} ID: ${from}`
          : `\n${v} Chat privado`) +
        `\n${h}`,
    );

    /* ================== COMMAND EXEC ================== */
    if (!global.comandos?.has(command)) return;

    const cmd = global.comandos.get(command);
    if (!cmd) return;

    if (cmd.isOwner &&
      !global.owner.map(n => n + "@s.whatsapp.net").includes(sender))
      return m.reply(mess.owner);

    if (cmd.isReg && !db.data.users[sender]?.registered)
      return m.reply(mess.registered);

    if (cmd.isGroup && !m.isGroup) return m.reply(mess.group);
    if (cmd.isAdmin && !isAdmins) return m.reply(mess.admin);
    if (cmd.isBotAdmin && !isBotAdmins) return m.reply(mess.botAdmin);
    if (cmd.isPrivate && m.isGroup) return m.reply(mess.private);

    try {
      await cmd.run(client, m, args, { text });
    } catch (err) {
      console.error(`Error en comando ${command}:`, err);
      await client.sendMessage(
        from,
        { text: "❌ Error al ejecutar el comando" },
        { quoted: m },
      );
    }

  } catch (fatal) {
    console.error("ERROR FATAL EN main.js:", fatal);
  }
};
