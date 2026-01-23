module.exports = {
  command: ["join"],
  categoria: "owner",
  description: "Une el bot a un grupo mediante link",

  run: async (client, m, args) => {
    try {
      // 🔐 Solo owner
      const sender = m.sender?.split("@")[0]
      if (!global.owner.includes(sender)) {
        return client.reply(m.chat, "❌ Solo el owner puede usar este comando.", m)
      }

      // ❌ Usar SOLO en privado (reduce bloqueos)
      if (m.isGroup) {
        return client.reply(
          m.chat,
          "⚠️ Usa este comando en privado conmigo para evitar bloqueos.",
          m
        )
      }

      if (!args[0]) {
        return client.reply(
          m.chat,
          "❌ Usa:\n.join https://chat.whatsapp.com/XXXXXXXX",
          m
        )
      }

      // 🔎 Extraer código de forma segura
      const match = args[0].match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/)
      if (!match) {
        return client.reply(m.chat, "❌ Link de grupo inválido.", m)
      }

      const inviteCode = match[1]

      await client.reply(m.chat, "⏳ Intentando unirme al grupo...", m)

      // 🕒 Delay corto (muy importante)
      await new Promise(res => setTimeout(res, 3000))

      // 🚀 Intentar unirse
      await client.groupAcceptInvite(inviteCode)

      client.reply(m.chat, "✅ Me uní al grupo correctamente.", m)

    } catch (err) {
      console.error("JOIN ERROR:", err?.data || err?.message)

      let msg = "❌ No pude unirme al grupo."

      if (err?.data === 400) {
        msg += "\n⚠️ WhatsApp rechazó la invitación (limitación temporal)."
      }

      msg += "\n👉 Intenta invitar al bot manualmente si persiste."

      client.reply(m.chat, msg, m)
    }
  }
}
