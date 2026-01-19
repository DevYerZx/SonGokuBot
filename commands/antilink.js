module.exports = async (client, m) => {
  try {
    // ───── FILTROS BÁSICOS ─────
    if (!m.isGroup) return;
    if (!m.text) return;

    // 🔒 El bot nunca se castiga
    if (m.fromMe) return;

    // 🔒 Antilink desactivado
    if (!global.db?.data?.chats?.[m.chat]?.antilink) return;

    // ───── REGEX ─────

    // ❌ SOLO WhatsApp (grupos y canales)
    const whatsappRegex =
      /(chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)/i;

    // ❌ Links raros / sospechosos
    const rareLinksRegex =
      /(https?:\/\/[^\s]+)/i;

    // ✅ Links permitidos
    const allowedRegex =
      /(youtube\.com|youtu\.be|facebook\.com|fb\.watch)/i;

    const text = m.text;

    const isWhatsApp = whatsappRegex.test(text);
    const isAllowed = allowedRegex.test(text);
    const isAnyLink = rareLinksRegex.test(text);

    // 👉 Si es link permitido → ignorar
    if (isAllowed && !isWhatsApp) return;

    // 👉 Si no es WhatsApp ni link raro → ignorar
    if (!isWhatsApp && !isAnyLink) return;

    // ───── VERIFICAR BOT ADMIN ─────
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
    if (isWhatsApp) {
      const invite =
        "https://chat.whatsapp.com/" +
        (await client.groupInviteCode(m.chat));

      if (new RegExp(invite, "i").test(text)) {
        return client.sendMessage(
          m.chat,
          { text: "✅ El enlace pertenece a este grupo" },
          { quoted: m },
        );
      }
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
        text: `🚫 *Anti-Link*\n\n@${m.sender.split("@")[0]} enviaste un enlace no permitido`,
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

