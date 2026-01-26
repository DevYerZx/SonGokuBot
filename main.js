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
  fs.writeFileSync(antiPath, JSON.stringify({ intentos: [] }, null, 2));
}

/* ================== DESBLOQUEO AUTOMÁTICO ================== */
// revisa cada 1 minuto
setInterval(async () => {
  try {
    const data = JSON.parse(fs.readFileSync(antiPath));
    const ahora = Date.now();
    const restantes = [];

    for (const i of data.intentos) {
      if (i.desbloquearEn && ahora >= i.desbloquearEn) {
        try {
          await global.client.updateBlockStatus(i.numero, "unblock");
          console.log(chalk.green(`✔ Usuario desbloqueado: ${i.numero}`));
        } catch (e) {
          console.log(chalk.red(`✖ Error al desbloquear ${i.numero}`));
          restantes.push(i);
        }
      } else {
        restantes.push(i);
      }
    }

    data.intentos = restantes;
    fs.writeFileSync(antiPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log(chalk.red("Error en desbloqueo automático"), e);
  }
}, 60 * 1000);

seeCommands();

module.exports = async (client, m) => {
  // guardamos el client global para el desbloqueo
  global.client = client;

  let body = "";

  /* ================== ANTI PRIVADO ================== */
  const from = m.key.remoteJid;
  const senderJid = m.key.participant || m.key.remoteJid;
  const senderNum = senderJid.split("@")[0];
  const isGroup = from.endsWith("@g.us");
  const isOwner = global.owner.includes(senderNum);

  if (!isGroup && global.antiPrivado && !isOwner) {
    const data = JSON.parse(fs.readFileSync(antiPath));

    const desbloquearEn =
      Date.now() + global.horasDesbloqueo * 60 * 60 * 1000;

    data.intentos.push({
      numero: senderJid,
      fecha: new Date().toLocaleString(),
      desbloquearEn,
    });

    fs.writeFileSync(antiPath, JSON.stringify(data, null, 2));

    // 📩 mensaje + link
    await client.sendMessage(from, {
      text:
        "🚫 *Este bot no responde mensajes privados*\n\n" +
        "👉 Únete al *grupo oficial* para usar el bot:\n" +
        global.grupoOficial +
        `\n\n⏱️ Serás desbloqueado automáticamente en ${global.horasDesbloqueo} horas.`,
    });

    // ⛔ bloquear usuario
    await client.updateBlockStatus(senderJid, "block");

    return; // ⛔ corta todo
  }
  /* ================== FIN ANTI PRIVADO ================== */

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
  let groupAdmins = [];
  let resolvedAdmins = [];
  let groupName = "";

  /* ================== FIX ANTI 403 + ANTI CRASH ================== */
  if (m.isGroup) {
    try {
      groupMetadata = await client.groupMetadata(m.chat);
    } catch (e) {
      groupMetadata = null;
    }

    if (groupMetadata) {
      groupName = groupMetadata.subject || "";

      groupAdmins = groupMetadata.participants.filter(
        (p) => p.admin === "admin" || p.admin === "superadmin"
      );

      resolvedAdmins = await Promise.all(
        groupAdmins.map(async (adm) => {
          let realJid = adm.jid;
          try {
            realJid = await resolveLidToRealJid(adm.jid, client, m.chat);
          } catch (e) {}
          return { ...adm, jid: realJid };
        })
      );
    }
  }

  const isBotAdmins =
    m.isGroup && resolvedAdmins.length
      ? resolvedAdmins.some((p) => p.jid === botJid)
      : false;

  const isAdmins =
    m.isGroup && resolvedAdmins.length
      ? resolvedAdmins.some((p) => p.jid === m.sender)
      : false;

  /* ================== LOG ================== */
  const h = chalk.bold.blue("************************************");
  const v = chalk.bold.white("*");

  const date = chalk.bold.yellow(
    `\n${v} Fecha: ${chalk.whiteBright(moment().format("DD/MM/YY HH:mm:ss"))}`
  );

  const userPrint = chalk.bold.blueBright(
    `\n${v} Usuario: ${chalk.whiteBright(pushname)}`
  );

  const senderPrint = chalk.bold.magentaBright(
    `\n${v} Remitente: ${gradient("deepskyblue", "darkorchid")(sender)}`
  );

  const groupPrint = m.isGroup
    ? chalk.bold.cyanBright(
        `\n${v} Grupo: ${chalk.greenBright(groupName)}\n${v} ID: ${gradient(
          "violet",
          "midnightblue"
        )(from)}\n`
      )
    : chalk.bold.greenBright(`\n${v} Chat privado\n`);

  console.log(`\n${h}${date}${userPrint}${senderPrint}${groupPrint}${h}`);

  /* ================== EJECUCIÓN DE COMANDOS ================== */
  if (global.comandos.has(command)) {
    const cmdData = global.comandos.get(command);
    if (!cmdData) return;

    if (
      cmdData.isOwner &&
      !global.owner.map((num) => num + "@s.whatsapp.net").includes(m.sender)
    )
      return m.reply(mess.owner);

    if (cmdData.isReg && !db.data.users[m.sender]?.registered)
      return m.reply(mess.registered);

    if (cmdData.isGroup && !m.isGroup) return m.reply(mess.group);
    if (cmdData.isAdmin && !isAdmins) return m.reply(mess.admin);
    if (cmdData.isBotAdmin && !isBotAdmins) return m.reply(mess.botAdmin);
    if (cmdData.isPrivate && m.isGroup) return m.reply(mess.private);

    try {
      await cmdData.run(client, m, args, { text });
    } catch (error) {
      console.error(
        chalk.red(`Error ejecutando comando ${command}:`),
        error
      );

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
  console.log(
    chalk.yellowBright(
      `\nSe actualizó ${path.basename(__filename)}, recargando...`
    )
  );
  delete require.cache[mainFile];
  require(mainFile);
});
