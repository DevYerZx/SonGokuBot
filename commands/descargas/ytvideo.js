const axios = require("axios")
const { payOrBypass } = require("../../lib/pay")

// API GawrGura
const GAWRGURA_API = "https://gawrgura-api.onrender.com/download/ytdl"

const BOT_NAME = "KILLUA-BOT v1.00"
const COST = 40 // 💰 costo en ZEIN por descarga

module.exports = {
  command: ["ytvideo"],
  categoria: "descarga",
  description: "Descarga videos de YouTube",

  run: async (client, m, args) => {
    try {
      const url = args[0]

      if (!url || !url.startsWith("http")) {
        return client.reply(
          m.chat,
          "❌ Enlace de YouTube no válido.",
          m,
          global.channelInfo
        )
      }

      // 💳 Cobro inteligente
      const pay = await payOrBypass(m, COST, client)
      if (!pay.ok) return

      // 🧾 Avisos
      if (pay.free) {
        await client.reply(
          m.chat,
          m.isOwner
            ? "👑 *OWNER*\nDescarga gratuita activada."
            : "🤖 *BOT OFICIAL*\nDescarga gratuita activada.",
          m
        )
      } else {
        await client.reply(
          m.chat,
          `
💸 *ZEIN PAGADO*
━━━━━━━━━━━━━━
🏦 Banco: -${pay.fromBank}
💰 Jenny: -${pay.fromJenny}
💵 Total: ${COST}
`,
          m
        )
      }

      // ⏳ Descarga
      await client.reply(
        m.chat,
        `⏳ *Descargando video...*\n✅ API: GawrGura\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      )

      // 📡 API
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

      title = title.replace(/[\\/:*?"<>|]/g, "").trim()
      if (title.length > 60) title = title.slice(0, 60)

      await client.sendMessage(
        m.chat,
        {
          video: { url: videoUrl },
          mimetype: "video/mp4",
          fileName: `${title}.mp4`
        },
        { quoted: m, ...global.channelInfo }
      )

    } catch (err) {
      console.error("YTVIDEO ERROR:", err.response?.data || err.message)
      await client.reply(
        m.chat,
        "❌ Error al descargar el video.",
        m,
        global.channelInfo
      )
    }
  }
}
