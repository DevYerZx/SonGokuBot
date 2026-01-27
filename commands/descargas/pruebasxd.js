const axios = require("axios")
const yts = require("yt-search")
const fs = require("fs")
const path = require("path")

const BOT_NAME = "SonGokuBot"
const API_URL = "https://nexevo-api.vercel.app/download/y2"

module.exports = {
  command: ["ytdoc1"],
  categoria: "descarga",
  description: "Descarga videos de YouTube y los envía como documento",

  run: async (client, m, args) => {
    let videoPath

    try {
      if (!args.length)
        return m.reply(
          "❌ Ingresa un enlace o nombre del video de YouTube.",
          m,
          global.channelInfo
        )

      let query = args.join(" ")
      let title = "youtube_video"

      // 🔎 Buscar si no es URL
      if (!query.startsWith("http")) {
        const search = await yts(query)
        if (!search.videos.length)
          return m.reply("❌ No se encontraron resultados.", m, global.channelInfo)

        query = search.videos[0].url
        title = search.videos[0].title || title
      }

      // 🔔 Notificación de descarga
      await client.reply(
        m.chat,
        `📥 Descargando video...\n⏳ ${BOT_NAME} está trabajando`,
        m,
        global.channelInfo
      )

      // 🌐 Llamar API
      const res = await axios.get(API_URL, {
        params: { url: query },
        timeout: 120000
      })

      const data = res.data?.result
      if (!data?.url) throw new Error("No se obtuvo enlace de descarga")

      const safeTitle = (data.info?.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .slice(0, 60)

      // 📂 TMP
      const tmpDir = path.join(__dirname, "../../tmp")
      fs.mkdirSync(tmpDir, { recursive: true })

      // ⬇️ Descargar video a local
      const videoRes = await axios.get(data.url, {
        responseType: "arraybuffer",
        timeout: 300000
      })

      videoPath = path.join(tmpDir, `${Date.now()}.mp4`)
      fs.writeFileSync(videoPath, videoRes.data)

      // 📤 Enviar como DOCUMENTO (sin preview)
      await client.sendMessage(
        m.chat,
        {
          document: fs.readFileSync(videoPath),
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`
        },
        { quoted: m, ...global.channelInfo }
      )

    } catch (err) {
      console.error(err)
      await client.reply(
        m.chat,
        "❌ Error al descargar o enviar el archivo.",
        m,
        global.channelInfo
      )
    } finally {
      // 🧹 Limpiar TMP
      if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
    }
  }
}


