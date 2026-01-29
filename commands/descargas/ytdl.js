const axios = require("axios")
const yts = require("yt-search")
const fs = require("fs")
const path = require("path")

module.exports = {
  command: ["ytdl"],
  categoria: "descarga",
  description: "Descarga música y la envía como nota de voz",

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
      await m.reply("⬇️ Descargando audio...")

      // 📡 API
      const api = `https://gawrgura-api.onrender.com/download/ytdl?url=${encodeURIComponent(video.url)}`
      const { data } = await axios.get(api)

      if (!data.status || !data.result?.mp3) {
        return m.reply("❌ Audio no disponible")
      }

      // 📁 ruta temporal
      const audioPath = path.join(
        __dirname,
        `temp_${Date.now()}.mp3`
      )

      // ⬇️ descargar archivo
      const response = await axios({
        method: "GET",
        url: data.result.mp3,
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      })

      const writer = fs.createWriteStream(audioPath)
      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve)
        writer.on("error", reject)
      })

      // 🎙️ enviar como NOTA DE VOZ
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(audioPath),
          mimetype: "audio/mpeg",
          ptt: true
        },
        { quoted: m }
      )

      // 🧹 borrar archivo
      fs.unlinkSync(audioPath)

    } catch (err) {
      console.error(err)
      m.reply("❌ Error al procesar el audio")
    }
  }
}