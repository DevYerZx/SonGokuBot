const axios = require("axios")
const yts = require("yt-search")

module.exports = {
  command: ["ytdl"],
  categoria: "descarga",
  description: "Descarga música de YouTube como nota de voz",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return m.reply("❌ Usa:\n.ytdl chaparrita yeri mua")
      }

      await m.reply("🎧 Buscando música...")

      const search = await yts(args.join(" "))
      if (!search.videos.length) {
        return m.reply("❌ No se encontró la canción")
      }

      const video = search.videos[0]

      await m.reply(`🎙️ Grabando audio...\n🎶 *${video.title}*`)

      const api = `https://gawrgura-api.onrender.com/download/ytdl?url=${encodeURIComponent(video.url)}`
      const { data } = await axios.get(api)

      if (!data.status || !data.result?.mp3) {
        return m.reply("❌ Audio no disponible")
      }

      // ✅ NOTA DE VOZ (PTT)
      await client.sendMessage(
        m.chat,
        {
          audio: { url: data.result.mp3 },
          mimetype: "audio/mpeg",
          ptt: true
        },
        { quoted: m }
      )

    } catch (e) {
      console.error(e)
      m.reply("❌ Error al enviar la nota de voz")
    }
  }
}