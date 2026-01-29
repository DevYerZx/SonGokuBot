const axios = require("axios")
const yts = require("yt-search")

module.exports = {
  command: ["ytdl"],
  categoria: "descarga",
  description: "Descarga música como nota de voz",

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

      await m.reply("🎙️ Grabando nota de voz...")

      const api = `https://gawrgura-api.onrender.com/download/ytdl?url=${encodeURIComponent(video.url)}`
      const { data } = await axios.get(api, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        }
      })

      if (!data.status || !data.result?.mp3) {
        return m.reply("❌ Audio no disponible")
      }

      // 🔥 ENVÍO COMO NOTA DE VOZ (FORMA CORRECTA)
      await client.sendMessage(
        m.chat,
        {
          audio: {
            url: data.result.mp3
          },
          mimetype: "audio/mpeg",
          ptt: true,
          contextInfo: {
            forwardingScore: 999,
            isForwarded: false
          }
        },
        { quoted: m }
      )

    } catch (err) {
      console.error(err)
      m.reply("❌ Error al enviar la nota de voz")
    }
  }
}