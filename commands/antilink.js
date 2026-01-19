module.exports = async (client, m) => {
  // 🔒 Solo grupos
  if (!m.isGroup) return;

  // 🔒 El bot nunca se castiga
  if (m.fromMe) return;

  // 🔒 Antilink apagado
  if (!global.db.data.chats[m.chat]?.antilink) return;

  if (!m.text) return;

  /* ================== REGLAS ================== */

  // ❌ WhatsApp grupos y canales (PROHIBIDOS)
  const whatsappRegex =
    /chat\.whatsapp\.com\/|whatsapp\.com\/channel\//i;

  // ❌ Links raros / sospechosos (PROHIBIDOS)
  const rareLinksRegex =
    /bit\.ly|tinyurl\.com|cutt\.ly|rb\.gy|t\.co|shorturl|adf\.ly|ouo\.io|linktr\.ee|http(s)?:\/\/[^\s]+/i;

  // ✅ Links permitidos
  const allowedRegex =
    /youtube\.com|youtu\.be|facebook\.com|fb\.watch/i;

  const isWhatsAppLink = whatsappRegex.test(m.text);
  const isAllowedLink = allowedRegex.test(m.text);
  const isAnyLink = rareLinksRegex.test(m.text);

  // 👉 Si es link permitido, no hacer nada
  if (isAllowedLink && !isWhatsAppLink) return;

  // 👉 Castigar SOLO si:
  // - Es link de WhatsApp
  // - O es link raro
  if (!isWhatsAppLink && !isAnyLink) return;

  try {
    // 🔒 Verificar admin del bot
    const botJid = client.user.id.split(":")[0] + "@s.whatsapp.net";
    const metadata = await client.groupMetadata(m.chat).catch(() => null);
    if (!metadata) return;

    const isBotAdmin = metadata.participants.some(
      (p) =>
        p.id === botJid &&
        (p.admin === "admin" || p.admin === "superadmin"),
    );

    if (!isBotAdmin) return;

    // 🔗 Permitir link del MISMO grupo
    if (isWhatsAppLink) {
      let gclink =
        "https://chat.whatsapp.com/" +
        (await client.groupInviteCode(m.chat));

      if (new RegExp(gclink, "i").test(m.text)) {
        return client.sendMessage(
          m.chat,
          { text: "✅ El enlace pertenece a este grupo" },
          { quoted: m },
        );
      }
    }

    // 🗑️ Borrar mensaje
    await client.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.key.participant,
      },
    });

    // ⚠️ Aviso
    await client.sendMessage(
      m.chat,
      {
        text: `🚫 *Anti Links*\n\n@${m.sender.split("@")[0]} enviaste un enlace *no permitido*`,
        contextInfo: { mentionedJid: [m.sender] },
      },
      { quoted: m },
    );

    // 👢 Expulsar usuario
    await client.groupParticipantsUpdate(m.chat, [m.sender], "remove");
  } catch (e) {
    console.log("ANTILINK ERROR:", e);
  }
};
