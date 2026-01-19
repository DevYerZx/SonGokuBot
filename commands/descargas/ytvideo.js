const axios = require("axios")

// API GawrGura
const GAWRGURA_API = "https://gawrgura-api.onrender.com/download/ytdl"

const BOT_NAME = "SonGokuBot"

// 🧠 Control de descargas por usuario
const videoEnProceso = new Set()

module.exports = {
  command: ["ytvideo"],
  categoria: "descarga",
  description: "Descarga videos de YouTube",

  run: async (client, m, args) => {
    const userId = m.sender

    try {
      if (videoEnProceso.has(userId)) {
        return client.reply(
          m.chat,
          "⏳ Espera a que termine tu video actual antes de pedir otro.",
          m
        )
      }

      const url = args[0]
      if (!url || !url.startsWith("http")) {
        return client.reply(
          m.chat,
          "❌ Enlace de YouTube no válido.",
          m,
          global.channelInfo
        )
      }

      // Marcar usuario como en proceso
      videoEnProceso.add(userId)

      // Aviso de descarga
      await client.reply(
        m.chat,
        `⏳ *Descargando video...*\n✅ API: GawrGura\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      )

      // Llamada a la API
      const res = await axios.get(
        `${GAWRGURA_API}?url=${encodeURIComponent(url)}`,
        { timeout: 120000 }
      )

      const videoData = res.data?.result
      if (!res.data?.status || !videoData?.mp4) {
        throw new Error("Respuesta inválida de GawrGura API")
      }

      let videoUrl = videoData.mp4
      let title = videoData.title || "video"
      title = title.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60)

      await client.sendMessage(
        m.chat,
        {
          video: { url: videoUrl },
          mimetype: "video/mp4",
          fileName: `${title}.mp4`
        },
        { quoted: m, ...global.channelInfo }
      )

      // Quitar bloqueo
      videoEnProceso.delete(userId)

    } catch (err) {
      console.error("YTVIDEO ERROR:", err.response?.data || err.message)
      videoEnProceso.delete(userId)
      await client.reply(
        m.chat,
        "❌ Error al descargar el video.",
        m,
        global.channelInfo
      )
    }
  }
}
