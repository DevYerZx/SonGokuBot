module.exports = {
  command: ["reiniciarbot", "restart"],
  categoria: "owner",

  run: async (client, m) => {
    try {
      const senderNumber = m.sender?.split("@")[0]

      if (!global.owner.includes(senderNumber)) {
        return client.reply(
          m.chat,
          "❌ Solo el owner puede usar este comando.",
          m
        )
      }

      await client.reply(m.chat, "♻️ Reiniciando bot...", m)

      process.exit(0)

    } catch (err) {
      console.error("REINICIARBOT ERROR:", err)
      client.reply(m.chat, "❌ Error al reiniciar el bot.", m)
    }
  }
}


