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

seeCommands();

module.exports = async (client, m) => {
  try {
    let body = "";

    if (m.message) {
      body =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption ||
        m.message.buttonsResponseMessage?.selectedButtonId ||
        m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        m.message.templateButtonReplyMessage?.selectedId ||
        "";
    }

    initDB(m);

    if (m.isGroup) {
      try {
        await antilink(client, m);
      } catch {}
    }

    const prefix = [".", "!", "#", "/"].find((p) => body.startsWith(p));
    if (!prefix) return;

    const command = body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(" ");

    const sender = m.sender;
    const from = m.chat;

    let isAdmins = false;
    let isBotAdmins = false;

    if (m.isGroup) {
      try {
        const meta = await client.groupMetadata(from);
        const admins = meta.participants.filter((p) => p.admin);
        const resolved = await Promise.all(
          admins.map(async (a) => ({
            ...a,
            jid: await resolveLidToRealJid(a.id || a.jid, client),
          })),
        );

        isAdmins = resolved.some((a) => a.jid === sender);
        isBotAdmins = resolved.some(
          (a) => a.jid === client.user.id.split(":")[0] + "@s.whatsapp.net",
        );
      } catch {}
    }

    /* ================== EJECUCIÓN ================== */
    if (!global.comandos.has(command)) return;

    const cmd = global.comandos.get(command);

    if (cmd.isOwner && !global.owner.map((o) => o + "@s.whatsapp.net").includes(sender))
      return m.reply(mess.owner);

    if (cmd.isGroup && !m.isGroup) return m.reply(mess.group);
    if (cmd.isAdmin && !isAdmins) return m.reply(mess.admin);
    if (cmd.isBotAdmin && !isBotAdmins) return m.reply(mess.botAdmin);

    if (!db.data.users[sender]) {
      db.data.users[sender] = { registered: false };
    }

    await cmd.run(client, m, args, { text });
  } catch (e) {
    console.log(chalk.red("ERROR EN MAIN:"), e);
  }
};

/* ================== HOT RELOAD ================== */
const mainFile = require.resolve(__filename);
fs.watchFile(mainFile, () => {
  fs.unwatchFile(mainFile);
  console.log(chalk.yellow(`Recargando ${path.basename(__filename)}`));
  delete require.cache[mainFile];
  require(mainFile);
});
