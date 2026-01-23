module.exports = {
  command: ["salirgrupo"],
  categoria: "owner",
  description: "Hace que el bot salga del grupo actual",

  run: async (client, m) => {
    try {
      // 🔐 Solo owner
      const sender = m.sender?.split("@")[0]
      if (!global.owner.includes(sender)) {
        return client.reply(
          m.chat,
          "❌ Solo el owner puede usar este comando.",
          m
        )
      }

      // ❌ Solo en grupos
      if (!m.isGroup) {
        return client.reply(
          m.chat,
          "❌ Este comando solo funciona en grupos.",
          m
        )
      }

      await client.reply(
        m.chat,
        "👋 Saliendo del grupo...\n🤖 SonGokuBot",
        m
      )

      // 🚪 Salir del grupo
      await client.groupLeave(m.chat)

    } catch (err) {
      console.error("LEAVE ERROR:", err)
      client.reply(
        m.chat,
        "❌ Error al salir del grupo.",
        m
      )
    }
  }
}
