module.exports = async (client, m) => {
  try {
    // ───── VALIDACIONES BÁSICAS ─────
    if (!m.isGroup) return;
    if (!m.text) return;

    // 🤖 El bot nunca se castiga
    if (m.fromMe) return;

    // 🔒 Antilink apagado
    if (!global.db.data.chats[m.chat]?.antilink) return;

    // ❌ SOLO enlaces de WhatsApp (grupos o canales)
    const whatsappRegex =
      /(chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)/i;

    if (!whatsappRegex.test(m.text)) return;

    // ───── VERIFICAR ADMIN DEL BOT ─────
    const metadata = await client.groupMetadata(m.chat).catch(() => null);
    if (!metadata) return;

    const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net";
    const isBotAdmin = metadata.participants.some(
      (p) =>
        p.id === botJid &&
        (p.admin === "admin" || p.admin === "superadmin"),
    );

    if (!isBotAdmin) return;

    // ───── PERMITIR LINK DEL MISMO GRUPO ─────
    const gclink =
      "https://chat.whatsapp.com/" +
      (await client.groupInviteCode(m.chat));

    if (new RegExp(gclink, "i").test(m.text)) {
      return client.sendMessage(
        m.chat,
        { text: "✅ El enlace pertenece a este grupo" },
        { quoted: m },
      );
    }

    // ───── BORRAR MENSAJE ─────
    await client.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.key.participant,
      },
    });

    // ───── AVISO ─────
    await client.sendMessage(
      m.chat,
      {
        text: `🚫 *Anti-Link*\n\n@${m.sender.split("@")[0]} enviaste un enlace de WhatsApp`,
        contextInfo: { mentionedJid: [m.sender] },
      },
      { quoted: m },
    );

    // ───── EXPULSAR ─────
    await client.groupParticipantsUpdate(m.chat, [m.sender], "remove");
  } catch (e) {
    console.log("ANTILINK ERROR:", e);
  }
};

