const { createSubBot } = require("../../subbot")

module.exports = {
  command: ["subbot"],
  isOwner: false, // cualquiera puede usarlo
  isPrivate: false,

  run: async (client, m, args) => {
    if (!args[0]) {
      return m.reply("📱 Usa:\n.subbot 519XXXXXXXX")
    }

    const phone = args[0].replace(/\D/g, "")

    try {
      const code = await createSubBot(phone)

      await client.sendMessage(m.chat, {
        text:
          `🤖 *SUBBOT CREADO*\n\n` +
          `📲 Número: ${phone}\n\n` +
          `🔐 *Código de vinculación*\n` +
          `${code}\n\n` +
          `WhatsApp > Dispositivos vinculados > Vincular con código`
      })
    } catch (e) {
      console.error(e)
      m.reply("❌ Error creando el subbot")
    }
  }
}