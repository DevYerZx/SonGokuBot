const axios = require("axios")
const yts = require("yt-search")

module.exports = {
  command: ["ytdl", "yt"],
  categoria: "descarga",
  description: "Busca en YouTube y envía siempre como video",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply(
          "❌ Escribe qué quieres buscar\n\n" +
          "📌 Ejemplo:\n" +
          ".ytdl mp3 beele santorini\n" +
          ".ytdl mp4 beele santorini"
        )
      }

      let tipo = "mp3"
      let query = args.join(" ")

      if (["mp3", "mp4"].includes(args[0].toLowerCase())) {
        tipo = args[0].toLowerCase()
        query = args.slice(1).join(" ")
      }

      if (!query) return m.reply("❌ Escribe el nombre del video")

      m.reply("🔎 Buscando en YouTube...")

      const search = await yts(query)
      if (!search.videos.length) {
        return m.reply("❌ No se encontraron resultados")
      }

      const video = search.videos[0]
      const ytUrl = video.url

      m.reply(`⬇️ Descargando:\n🎵 *${video.title}*`)

      const api = `https://gawrgura-api.onrender.com/download/ytdl?url=${encodeURIComponent(ytUrl)}`
      const res = await axios.get(api)

      if (!res.data.status) {
        return m.reply("❌ Error al descargar")
      }

      const result = res.data.result
      const link = tipo === "mp3" ? result.mp3 : result.mp4

      if (!link) return m.reply("❌ Archivo no disponible")

      // 📹 SIEMPRE ENVIAR COMO VIDEO
      await client.sendMessage(m.chat, {
        video: { url: link },
        mimetype: "video/mp4",
        caption: `🎶 *${result.title}*\n\n🤖 ${global.BOT_NAME || "SonGokuBot"}`
      }, { quoted: m })

    } catch (err) {
      console.error(err)
      m.reply("❌ Ocurrió un error inesperado")
    }
  }
}

