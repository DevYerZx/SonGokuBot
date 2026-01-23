module.exports = {
  command: ["join", "unirgrupo"],
  categoria: "owner",
  description: "Hace que el bot se una a un grupo por link",

  run: async (client, m, args) => {
    try {
      // 🔐 Solo owner
      const sender = m.sender?.split("@")[0]
      if (!global.owner.includes(sender)) {
        return client.reply(m.chat, "❌ Solo el owner puede usar este comando.", m)
      }

      if (!args[0]) {
        return client.reply(
          m.chat,
          "❌ Usa:\n.join https://chat.whatsapp.com/XXXXXXXX",
          m
        )
      }

      const link = args[0]

      // 🧠 Extraer código del grupo
      const code = link.split("https://chat.whatsapp.com/")[1]
      if (!code) {
        return client.reply(m.chat, "❌ Link de grupo inválido.", m)
      }

      // 🚀 Unirse al grupo
      await client.groupAcceptInvite(code)

      client.reply(m.chat, "✅ El bot se unió al grupo correctamente.", m)

    } catch (err) {
      console.error("JOIN ERROR:", err)
      client.reply(
        m.chat,
        "❌ No pude unirme al grupo.\nPuede que el link esté vencido o el bot esté bloqueado.",
        m
      )
    }
  }
}
