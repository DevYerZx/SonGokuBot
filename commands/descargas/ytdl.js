const axios = require("axios")
const yts = require("yt-search")

module.exports = {
  command: ["ytdl", "yt"],
  categoria: "descarga",
  description: "Busca en YouTube y descarga automáticamente",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply("❌ Escribe qué quieres buscar\n\n📌 Ejemplo:\n.ytdl beele santorini")
      }

      let tipo = "mp3"
      let query = args.join(" ")

      // detectar mp3 / mp4
      if (["mp3", "mp4"].includes(args[0].toLowerCase())) {
        tipo = args[0].toLowerCase()
        query = args.slice(1).join(" ")
      }

      if (!query) {
        return m.reply("❌ Escribe el nombre del video")
      }

      m.reply("🔎 Buscando en YouTube...")

      // 🔍 búsqueda
      const search = await yts(query)
      if (!search.videos.length) {
        return m.reply("❌ No se encontraron resultados")
      }

      const video = search.videos[0]
      const url = video.url

      m.reply(`⬇️ Descargando:\n🎵 *${video.title}*`)

      // 📥 descarga
      const api = `https://gawrgura-api.onrender.com/download/ytdl?url=${encodeURIComponent(url)}`
      const res = await axios.get(api)

      if (!res.data.status) {
        return m.reply("❌ Error al descargar")
      }

      const result = res.data.result
      const link = tipo === "mp3" ? result.mp3 : result.mp4

      if (!link) {
        return m.reply("❌ No se pudo obtener el archivo")
      }

      // 📤 enviar
      await client.sendMessage(m.chat, {
        [tipo === "mp3" ? "audio" : "video"]: { url: link },
        mimetype: tipo === "mp3" ? "audio/mpeg" : "video/mp4",
        caption: `🎶 *${result.title}*\n\n🤖 ${global.BOT_NAME || "SonGokuBot"}`
      }, { quoted: m })

    } catch (e) {
      console.error(e)
      m.reply("❌ Ocurrió un error")
    }
  }
}
