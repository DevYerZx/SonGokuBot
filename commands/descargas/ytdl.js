const axios = require("axios")
const yts = require("yt-search")

module.exports = {
  command: ["ytdl", "yt"],
  categoria: "descarga",
  description: "Busca y descarga YouTube (mp3 / mp4)",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply(
          "❌ Uso correcto:\n\n" +
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

      if (!query) return m.reply("❌ Escribe qué buscar")

      m.reply("🔎 Buscando en YouTube...")

      const search = await yts(query)
      if (!search.videos.length) {
        return m.reply("❌ No se encontraron resultados")
      }

      const video = search.videos[0]

      m.reply(`⬇️ Descargando:\n🎶 *${video.title}*`)

      const api = `https://gawrgura-api.onrender.com/download/ytdl?url=${encodeURIComponent(video.url)}`
      const res = await axios.get(api)

      if (!res.data.status) {
        return m.reply("❌ Error en la descarga")
      }

      const result = res.data.result

      // ✅ MP3 → AUDIO
      if (tipo === "mp3") {
        if (!result.mp3) return m.reply("❌ Audio no disponible")

        await client.sendMessage(m.chat, {
          audio: { url: result.mp3 },
          mimetype: "audio/mpeg",
          caption: `🎵 ${result.title}`
        }, { quoted: m })
      }

      // ✅ MP4 → VIDEO
      if (tipo === "mp4") {
        if (!result.mp4) return m.reply("❌ Video no disponible")

        await client.sendMessage(m.chat, {
          video: { url: result.mp4 },
          mimetype: "video/mp4",
          caption: `🎬 ${result.title}`
        }, { quoted: m })
      }

    } catch (e) {
      console.error(e)
      m.reply("❌ Error inesperado")
    }
  }
}

