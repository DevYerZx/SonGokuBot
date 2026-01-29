const yts = require("yt-search")

module.exports = {
  command: ["ytdl"],
  categoria: "descarga",
  description: "Buscar YouTube y elegir mp3 o mp4",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply("❌ Usa:\n.ytdl ozuna odisea")
      }

      await m.reply("🔎 Buscando en YouTube...")

      const search = await yts(args.join(" "))
      if (!search.videos.length) {
        return m.reply("❌ No se encontraron resultados")
      }

      const v = search.videos[0]

      const menu = {
        text:
          `🎶 *${v.title}*\n` +
          `👤 ${v.author.name}\n` +
          `⏱ ${v.timestamp}\n\n` +
          `👇 Elige formato de descarga`,
        footer: "🐲 SonGokuBot • DVYER",
        title: "YouTube Downloader",
        buttonText: "📥 Elegir formato",
        sections: [
          {
            title: "Formatos disponibles",
            rows: [
              {
                title: "🎵 Audio MP3",
                description: "Descargar solo audio",
                rowId: `.ytdlmp3 ${v.url}`
              },
              {
                title: "🎬 Video MP4",
                description: "Descargar video",
                rowId: `.ytdlmp4 ${v.url}`
              }
            ]
          }
        ]
      }

      await client.sendMessage(m.chat, menu, { quoted: m })

    } catch (e) {
      console.error(e)
      m.reply("❌ Error inesperado")
    }
  }
}