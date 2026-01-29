const yts = require("yt-search")

module.exports = {
  command: ["ytdl", "yt"],
  categoria: "descarga",

  run: async (client, m, args) => {
    if (!args.length) {
      return m.reply("❌ Usa:\n.ytdl ozuna odisea")
    }

    const query = args.join(" ")
    await m.reply("⏳ Buscando tu video...")

    const search = await yts(query)
    if (!search.videos.length) {
      return m.reply("❌ No se encontró nada")
    }

    const video = search.videos[0]

    const menu = {
      text:
        `🎶 *${video.title}*\n` +
        `👤 ${video.author.name}\n` +
        `⏱ ${video.timestamp}\n\n` +
        `👇 Selecciona formato`,
      footer: "🤖 SonGokuBot",
      title: "YouTube Downloader",
      buttonText: "📥 Elegir formato",
      sections: [
        {
          title: "Opciones",
          rows: [
            {
              title: "🎵 Audio MP3",
              description: "Descargar solo audio",
              rowId: `.ytdlmp3 ${video.url}`
            },
            {
              title: "🎬 Video MP4",
              description: "Descargar video",
              rowId: `.ytdlmp4 ${video.url}`
            }
          ]
        }
      ]
    }

    await client.sendMessage(m.chat, menu, { quoted: m })
  }
}