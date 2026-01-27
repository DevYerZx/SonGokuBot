const fetch = require("node-fetch")

module.exports = {
  command: ["ytmp4doc", "ytdoc"],
  categoria: "descargas",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply("❌ Usa el comando así:\n*.ytmp4doc <link de YouTube>*")
      }

      const url = args[0]
      const api = `https://nexevo-api.vercel.app/download/y2?url=${encodeURIComponent(url)}`

      await m.reply("⏳ Descargando video como documento...")

      const res = await fetch(api)
      const json = await res.json()

      if (!json.status || !json.result?.url) {
        return m.reply("❌ No se pudo obtener el video.")
      }

      const videoUrl = json.result.url
      const title = json.result.info.title || "youtube_video"

      await client.sendMessage(m.chat, {
        document: { url: videoUrl },
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `📁 *YOUTUBE MP4*\n🎬 Calidad: 360p`
      }, { quoted: m })

    } catch (err) {
      console.error(err)
      m.reply("❌ Error al enviar el documento.")
    }
  }
}
