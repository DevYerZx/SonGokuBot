const fs = require("fs")
const path = require("path")
const fetch = require("node-fetch")
const axios = require("axios")

module.exports = {
  command: ["ytmp4doc", "ytdoc"],
  categoria: "descargas",

  run: async (client, m, args) => {
    try {
      if (!args[0]) {
        return m.reply("❌ Usa:\n*.ytmp4doc <link de YouTube>*")
      }

      const url = args[0]
      const api = `https://nexevo-api.vercel.app/download/y2?url=${encodeURIComponent(url)}`

      await m.reply("⏳ Descargando video en local...")

      // 1️⃣ Llamar a la API
      const res = await fetch(api)
      const json = await res.json()

      if (!json.status || !json.result?.url) {
        return m.reply("❌ No se pudo obtener el enlace del video.")
      }

      const videoUrl = json.result.url
      const title = (json.result.info.title || "youtube_video")
        .replace(/[\\/:*?"<>|]/g, "") // limpiar nombre

      // 2️⃣ Ruta temporal
      const tmpPath = path.join(__dirname, `../tmp/${title}.mp4`)

      // 3️⃣ Descargar archivo a local
      const response = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "stream"
      })

      const writer = fs.createWriteStream(tmpPath)
      response.data.pipe(writer)

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve)
        writer.on("error", reject)
      })

      // 4️⃣ Enviar como DOCUMENTO
      await client.sendMessage(m.chat, {
        document: fs.readFileSync(tmpPath),
        mimetype: "video/mp4",
        fileName: `${title}.mp4`,
        caption: `📁 *YOUTUBE MP4*\n🎬 Calidad: 360p`
      }, { quoted: m })

      // 5️⃣ Borrar archivo temporal
      fs.unlinkSync(tmpPath)

    } catch (err) {
      console.error(err)
      m.reply("❌ Error durante la descarga o envío.")
    }
  }
}
