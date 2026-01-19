module.exports = async (client, m) => {
  // 🛑 SOLO GRUPOS
  if (!m.isGroup) return;

  // 🤖 IGNORAR MENSAJES DEL BOT (ESTA ES LA CLAVE)
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

  // ❌ SOLO DETECTAR WHATSAPP Y TELEGRAM (COMO TU ORIGINAL)
  let enlacesDetectados = ["whatsapp", "telegram"];

  if (validarLink(m.text, enlacesDetectados)) {
    try {
      let gclink =
        "https://chat.whatsapp.com/" +
        (await client.groupInviteCode(m.chat));

      let isLinkThisGc = new RegExp(gclink, "i");
      let isGcLink = isLinkThisGc.test(m.text);

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
          participant: m.key.participant,
        },
      });

      // ⚠️ AVISO
      await client.sendMessage(
        m.chat,
        {
          text: `Anti Enlaces\n\n@${m.sender.split("@")[0]} mandaste un enlace *prohibido*`,
          contextInfo: { mentionedJid: [m.sender] },
        },
        { quoted: m },
      );

      // 👢 EXPULSAR USUARIO
      await client.groupParticipantsUpdate(m.chat, [m.sender], "remove");
    } catch (e) {
      console.log("ANTILINK ERROR:", e);
    }
  }
};

