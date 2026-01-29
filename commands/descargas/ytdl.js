const axios = require("axios")
const yts = require("yt-search")

module.exports = {
  command: ["ytdl"],
  categoria: "descarga",
  description: "Busca YouTube y permite elegir audio o video",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply(
          "❌ Uso correcto:\n\n" +
          ".ytdl beele santorini"
        )
      }

      const query = args.join(" ")
      m.reply("🔎 Buscando en YouTube...")

      const search = await yts(query)
      if (!search.videos.length) {
        return m.reply("❌ No se encontraron resultados")
      }

      const video = search.videos[0]

      const buttons = [
        {
          buttonId: `.ytdlmp3 ${video.url}`,
          buttonText: { displayText: "🎵 Audio MP3" },
          type: 1
        },
        {
          buttonId: `.ytdlmp4 ${video.url}`,
          buttonText: { displayText: "🎬 Video MP4" },
          type: 1
        }
      ]

      await client.sendMessage(
        m.chat,
        {
          image: { url: video.thumbnail },
          caption:
            `📌 *${video.title}*\n` +
            `👤 Canal: ${video.author.name}\n` +
            `⏱ Duración: ${video.timestamp}\n\n` +
            `👇 Elige el formato:`,
          buttons,
          footer: "YouTube Downloader",
          headerType: 4
        },
        { quoted: m }
      )

    } catch (e) {
      console.error(e)
      m.reply("❌ Error inesperado")
    }
  }
}