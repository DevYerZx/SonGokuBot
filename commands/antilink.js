module.exports = async (client, m) => {
  // 🛑 SOLO GRUPOS
  if (!m.isGroup) return;

  // 🤖 IGNORAR MENSAJES DEL BOT
  if (m.fromMe) return;

  // 🔒 ANTILINK DESACTIVADO
  if (!global.db.data.chats[m.chat]?.antilink) return;

  // 🛑 SI NO HAY TEXTO
  if (!m.text) return;

  let linksProhibidos = {
    telegram: /telegram\.me|t\.me/gi,
    facebook: /facebook\.com/gi,
    whatsapp: /chat\.whatsapp\.com/gi,
    youtube: /youtu\.be|youtube\.com/gi,
  };

  function validarLink(mensaje, tipos) {
    for (let tipo of tipos) {
      if (mensaje.match(linksProhibidos[tipo])) {
        return true;
      }
    }
    return false;
  }

  // ❌ SOLO WHATSAPP Y TELEGRAM
  let enlacesDetectados = ["whatsapp", "telegram"];

  if (!validarLink(m.text, enlacesDetectados)) return;

  try {
    // 👤 SENDER REAL
    const sender = m.key.participant || m.sender;

    // 📌 METADATA
    const metadata = await client.groupMetadata(m.chat);

    // 👑 VERIFICAR ADMIN
    const isAdmin = metadata.participants.some(
      (p) =>
        p.id === sender &&
        (p.admin === "admin" || p.admin === "superadmin"),
    );

    // ✅ SI ES ADMIN → NO HACER NADA (NI BORRAR NI EXPULSAR)
    if (isAdmin) return;

    // 🔗 LINK DEL MISMO GRUPO
    let gclink =
      "https://chat.whatsapp.com/" +
      (await client.groupInviteCode(m.chat));

    let isGcLink = new RegExp(gclink, "i").test(m.text);

    // ✅ LINK DEL MISMO GRUPO (USUARIO NORMAL)
    if (isGcLink) {
      return client.sendMessage(
        m.chat,
        { text: `El enlace *pertenece* a este grupo` },
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

    // 👢 EXPULSAR USUARIO
    await client.groupParticipantsUpdate(m.chat, [sender], "remove");
  } catch (e) {
    console.log("ANTILINK ERROR:", e);
  }
};

