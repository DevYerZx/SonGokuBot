module.exports = {
  command: ["kick", "kill", "matar", "sacar"],
  description: "Expulsa a un miembro del grupo",
  category: "groups",
  isGroup: true,
  isAdmin: true,
  botAdmin: true,
  use: "(@0 o responder a un mensaje)",
  run: async (client, m, args) => {
    if (!m.mentionedJid[0] && !m.quoted) {
      return m.reply(
        "Etiqueta o responde al *mensaje* de la *persona* que quieres eliminar",
      );
    }

    let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted.sender;

    const groupInfo = await client.groupMetadata(m.chat);
    const ownerGroup =
      groupInfo.owner || m.chat.split`-`[0] + "@s.whatsapp.net";
    const ownerBot = global.owner[0][0] + "@s.whatsapp.net";

    if (user === client.decodeJid(client.user.id)) {
      return m.reply("No puedo eliminar al *bot* del grupo");
    }

    if (user === ownerGroup) {
      return m.reply("No puedo eliminar al *propietario* del grupo");
    }

    if (user === ownerBot) {
      return m.reply("No puedo eliminar al *propietario* del bot");
    }

    try {
      await client.groupParticipantsUpdate(m.chat, [user], "remove");
      m.reply(`Usuario *eliminado* correctamente`);
    } catch (e) {
      console.error(e);
      m.reply("No se pudo eliminar al usuario");
    }
  },
};
