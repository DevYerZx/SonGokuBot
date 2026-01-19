module.exports = async (client, m) => {
  try {
    if (!m.isGroup) return;
    if (!m.text) return;
    if (m.fromMe) return;

    if (!global.db.data.chats[m.chat]?.antilink) return;

    const whatsappRegex = /chat\.whatsapp\.com\/|whatsapp\.com\/channel\//i;
    if (!whatsappRegex.test(m.text)) return;

    const sender =
      m.key?.participant || m.participant || m.sender;

    if (!sender) return;

    // comprobar admin del bot
    const metadata = await client.groupMetadata(m.chat);
    const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net";

    const isBotAdmin = metadata.participants.some(
      (p) =>
        p.id === botJid &&
        (p.admin === "admin" || p.admin === "superadmin"),
    );

    if (!isBotAdmin) return;

    // permitir link del mismo grupo
    const gclink =
      "https://chat.whatsapp.com/" +
      (await client.groupInviteCode(m.chat));

    if (new RegExp(gclink, "i").test(m.text)) return;

    // borrar mensaje
    await client.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: sender,
      },
    });

    // aviso
    await client.sendMessage(
      m.chat,
      {
        text: `🚫 Anti-Link\n\n@${sender.split("@")[0]} enviaste un enlace de WhatsApp`,
        contextInfo: { mentionedJid: [sender] },
      },
      { quoted: m },
    );

    // expulsar
    await client.groupParticipantsUpdate(m.chat, [sender], "remove");
  } catch (e) {
    console.log("ANTILINK ERROR:", e);
  }
};

