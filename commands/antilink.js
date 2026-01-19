module.exports = async (client, m) => {
  try {
    // ───── FILTROS BÁSICOS (IGUAL QUE TU CÓDIGO FUNCIONAL) ─────
    if (!m.isGroup) return;
    if (!m.text) return;

    // 🔒 El bot nunca se castiga
    if (m.fromMe) return;

    // 🔒 Antilink apagado
    if (!global.db.data.chats[m.chat]?.antilink) return;

    // ───── REGEX ─────

    // ❌ SOLO WhatsApp (grupos y canales)
    const whatsappRegex =
      /(chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)/i;

    // ❌ Links raros / sospechosos
    const rareLinksRegex =
      /(https?:\/\/[^\s]+)/i;

    // ✅ Permitidos
    const allowedRegex =
      /(youtube\.com|youtu\.be|facebook\.com|fb\.watch)/i;

    const text = m.text;

    const isWhatsApp = whatsappRegex.test(text);
    const isAllowed = allowedRegex.test(text);
    const isAnyLink = rareLinksRegex.test(text);

    // 👉 Si es YouTube o Facebook, ignorar
    if (isAllowed && !isWhatsApp) return;

    // 👉 Si no es WhatsApp ni link raro, ignorar
    if (!isWhatsApp && !isAnyLink) return;

    // ───── PERMITIR LINK DEL MISMO GRUPO (COMO TU ORIGINAL) ─────
    if (isWhatsApp) {
      let gclink =
        "https://chat.whatsapp.com/" +
        (await client.groupInviteCode(m.chat));

      if (new RegExp(gclink, "i").test(text)) {
        return client.sendMessage(
          m.chat,
          { text: "El enlace *pertenece* a este grupo" },
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
        text: `Anti Enlaces\n\n@${m.sender.split("@")[0]} mandaste un enlace *prohibido*`,
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

