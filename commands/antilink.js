module.exports = async (client, m) => {
  // 🛑 SOLO GRUPOS
  if (!m.isGroup) return;

  // 🤖 IGNORAR MENSAJES DEL BOT
  if (m.fromMe) return;

  // 🔒 ANTILINK DESACTIVADO
  if (!global.db.data.chats[m.chat]?.antilink) return;

  // 🛑 SIN TEXTO
  if (!m.text) return;

  // 👤 SENDER REAL (FORMA SEGURA)
  const sender =
    m.key?.participant ||
    m.participant ||
    m.sender ||
    m.key?.remoteJid;

  if (!sender) return;

  let linksProhibidos = {
    telegram: /telegram\.me|t\.me/gi,
    whatsapp: /chat\.whatsapp\.com/gi,
  };

  function validarLink(mensaje, tipos) {
    return tipos.some((tipo) => linksProhibidos[tipo]?.test(mensaje));
  }

  let enlacesDetectados = ["whatsapp", "telegram"];
  if (!validarLink(m.text, enlacesDetectados)) return;

  try {
    const metadata = await client.groupMetadata(m.chat);

    // 👑 LISTA REAL DE ADMINS
    const adminJids = metadata.participants
      .filter((p) => p.admin === "admin" || p.admin === "superadmin")
      .map((p) => p.id);

    // ✅ SI ES ADMIN → NO HACER NADA
    if (adminJids.includes(sender)) return;

    // 🔗 LINK DEL MISMO GRUPO
    const gclink =
      "https://chat.whatsapp.com/" +
      (await client.groupInviteCode(m.chat));

    if (new RegExp(gclink, "i").test(m.text)) {
      return client.sendMessage(
        m.chat,
        { text: "El enlace *pertenece* a este grupo" },
        { quoted: m },
      );
    }

    // 🗑️ BORRAR MENSAJE
    await client.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: sender,
      },
    });

    // ⚠️ AVISO
    await client.sendMessage(
      m.chat,
      {
        text: `Anti Enlaces\n\n@${sender.split("@")[0]} mandaste un enlace *prohibido*`,
        contextInfo: { mentionedJid: [sender] },
      },
      { quoted: m },
    );

    // 👢 EXPULSAR
    await client.groupParticipantsUpdate(m.chat, [sender], "remove");
  } catch (e) {
    console.log("ANTILINK ERROR:", e);
  }
};


