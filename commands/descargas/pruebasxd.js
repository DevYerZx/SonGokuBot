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
    let videoPath, thumbPath

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

      await client.reply(
        m.chat,
        `📁 Preparando documento...\n⏳ ${BOT_NAME} está descargando`,
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

      // 🖼️ Miniatura
      if (data.info?.thumbnail) {
        const thumbRes = await axios.get(data.info.thumbnail, {
          responseType: "arraybuffer"
        })
        thumbPath = path.join(tmpDir, `${Date.now()}_thumb.jpg`)
        fs.writeFileSync(thumbPath, thumbRes.data)

        await client.sendMessage(
          m.chat,
          {
            image: fs.readFileSync(thumbPath),
            caption: `🎬 *${safeTitle}*\n🤖 ${BOT_NAME}`
          },
          { quoted: m, ...global.channelInfo }
        )
      }

      // ⬇️ Descargar video en local
      const videoRes = await axios.get(data.url, {
        responseType: "arraybuffer",
        timeout: 300000
      })

      videoPath = path.join(tmpDir, `${Date.now()}.mp4`)
      fs.writeFileSync(videoPath, videoRes.data)

      // 📤 Enviar como DOCUMENTO
      await client.sendMessage(
        m.chat,
        {
          document: fs.readFileSync(videoPath),
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`,
          caption: `📁 *YOUTUBE MP4*\n🎬 ${safeTitle}\n🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      )

    } catch (err) {
      console.error(err)
      await client.reply(
        m.chat,
        "❌ Error al descargar o enviar el documento.",
        m,
        global.channelInfo
      )
    } finally {
      // 🧹 Limpiar TMP
      if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath)
      if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath)
    }
  }
}

