const axios = require("axios")

const BOT_NAME = "SonGokuBot"
const API_URL = "https://api.nekolabs.web.id/downloader/instagram"

module.exports = {
  command: ["ig", "instagram"],
  categoria: "descarga",
  description: "Descarga videos de Instagram",

  run: async (client, m, args) => {
    try {
      if (!args.length)
        return m.reply(
          "❌ Debes colocar un enlace de Instagram.",
          m,
          global.channelInfo
        )

      const url = args[0]

      await client.reply(
        m.chat,
        `📥 Descargando video de Instagram...\n⏳ ${BOT_NAME} está trabajando`,
        m,
        global.channelInfo
      )

      const res = await axios.get(API_URL, {
        params: { url },
        timeout: 120000
      })

      const result = res.data?.result
      if (!res.data?.success || !result?.downloadUrl?.length)
        throw new Error("No se obtuvo video")

      const videoUrl = result.downloadUrl[0]

      const caption = `
📸 *INSTAGRAM DOWNLOADER*

👤 Usuario: ${result.metadata?.username || "Desconocido"}
💬 Comentarios: ${result.metadata?.comment ?? "?"}

📝 Descripción:
${result.metadata?.caption || "Sin descripción"}

🤖 ${BOT_NAME}
      `.trim()

      await client.sendMessage(
        m.chat,
        {
          video: { url: videoUrl },
          caption
        },
        { quoted: m, ...global.channelInfo }
      )

    } catch (error) {
      console.error(error)
      await client.reply(
        m.chat,
        "❌ Ocurrió un error al descargar el video de Instagram.",
        m,
        global.channelInfo
      )
    }
  }
}

