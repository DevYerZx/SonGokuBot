const axios = require("axios")

module.exports = {
  command: ["ig", "instagram"],
  categoria: "descargas",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply(
          "❌ *Debes enviar un link de Instagram*\n\nEjemplo:\n!ig https://www.instagram.com/reel/xxxxx"
        )
      }

      const url = args[0]
      m.reply("⏳ Descargando video de Instagram...")

      const api = `https://api.nekolabs.web.id/downloader/instagram?url=${encodeURIComponent(url)}`
      const res = await axios.get(api)

      if (!res.data.success) {
        return m.reply("❌ No se pudo descargar el contenido")
      }

      const data = res.data.result
      const videoUrl = data.downloadUrl[0]

      const caption = `
📥 *INSTAGRAM DOWNLOADER*

👤 Usuario: ${data.metadata.username}
💬 Comentarios: ${data.metadata.comment}

📝 Descripción:
${data.metadata.caption || "Sin descripción"}
      `.trim()

      await client.sendMessage(m.chat, {
        video: { url: videoUrl },
        caption,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: "120363000000000000@newsletter", // 👈 CAMBIA ESTO
            newsletterName: "🐉 SonGokuBot",
            serverMessageId: -1
          }
        }
      }, { quoted: m })

    } catch (e) {
      console.error(e)
      m.reply("❌ Error al descargar el video")
    }
  }
}
