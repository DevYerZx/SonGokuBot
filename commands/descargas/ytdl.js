const axios = require("axios")
const yts = require("yt-search")
const fs = require("fs")
const path = require("path")
const { exec } = require("child_process")

module.exports = {
  command: ["ytdl"],
  categoria: "descarga",
  description: "Descarga música y la envía como nota de voz (ffmpeg)",

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

      // 📁 rutas temporales
      const id = Date.now()
      const mp3Path = path.join(__dirname, `temp_${id}.mp3`)
      const opusPath = path.join(__dirname, `temp_${id}.opus`)

      // ⬇️ descargar MP3
      const response = await axios({
        method: "GET",
        url: data.result.mp3,
        responseType: "stream",
        headers: { "User-Agent": "Mozilla/5.0" }
      })

      const writer = fs.createWriteStream(mp3Path)
      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve)
        writer.on("error", reject)
      })

      // 🎛️ convertir con ffmpeg a OPUS (nota de voz real)
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${mp3Path}" -vn -c:a libopus -b:a 48k "${opusPath}"`,
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })

      // 🎙️ enviar nota de voz
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(opusPath),
          mimetype: "audio/ogg; codecs=opus",
          ptt: true
        },
        { quoted: m }
      )

      // 🧹 limpiar archivos
      fs.unlinkSync(mp3Path)
      fs.unlinkSync(opusPath)

    } catch (err) {
      console.error(err)
      m.reply("❌ Error al procesar el audio")
    }
  }
}