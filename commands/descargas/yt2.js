const axios = require("axios")
const yts = require("yt-search")

module.exports = {
  command: ["yt2],
  categoria: "descarga",
  description: "Busca o descarga videos de YouTube en MP4",

  run: async (client, m, args) => {
    try {
      if (!args.length)
        return m.reply("❌ Escribe un nombre o enlace de YouTube")

      m.reply("🔎 Buscando video...")

      let ytUrl = args[0]

      // 🔍 SI NO ES LINK → BUSCAR
      if (!args[0].includes("youtu")) {
        const search = await yts(args.join(" "))
        if (!search.videos.length)
          return m.reply("❌ No encontré resultados")

        const video = search.videos[0]
        ytUrl = video.url
      }

      // 📥 DESCARGA
      const api = `https://nexevo-api.vercel.app/download/y2?url=${encodeURIComponent(ytUrl)}`
      const { data } = await axios.get(api)

      if (!data.status || !data.result?.url)
        return m.reply("❌ No se pudo descargar el video")

      const res = data.result
      const quality = res.quality || 360

      await client.sendMessage(m.chat, {
        video: { url: res.url },
        mimetype: "video/mp4",
        caption: `🎬 *YouTube Video*\n\n📺 Calidad: ${quality}p\n🤖 ${global.botname || "SonGokuBot"}`
      }, { quoted: m })

    } catch (e) {
      console.error(e)
      m.reply("❌ Error al procesar el video")
    }
  }
}
