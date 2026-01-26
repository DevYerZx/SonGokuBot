const axios = require("axios")
const fs = require("fs")
const path = require("path")

const BOT_NAME = "SonGokuBot"
const API_URL = "https://api.fabdl.com/spotify"

module.exports = {
  command: ["spotify", "sp"],
  categoria: "descarga",
  description: "Busca canciones en Spotify y descarga el audio",

  run: async (client, m, args) => {
    let audioPath, coverPath

    try {
      if (!args.length)
        return m.reply(
          "❌ Debes escribir el nombre de la canción.\n\nEjemplo:\n!spotify ozuna",
          m,
          global.channelInfo
        )

      const query = args.join(" ")

      await client.reply(
        m.chat,
        `🎵 Buscando en Spotify...\n⏳ ${BOT_NAME} está trabajando`,
        m,
        global.channelInfo
      )

      // 🔍 Buscar canción (RUTA CORRECTA)
      const res = await axios.get(API_URL, {
        params: { q: query },
        timeout: 120000
      })

      if (!res.data?.success)
        throw new Error("No hubo resultados")

      const result = res.data.result
      const meta = result.metadata

      const tmpDir = path.join(__dirname, "../../tmp")
      fs.mkdirSync(tmpDir, { recursive: true })

      // 📥 Descargar audio
      const audioRes = await axios.get(result.downloadUrl, {
        responseType: "arraybuffer",
        timeout: 300000
      })

      const safeTitle = `${meta.title} - ${meta.artist}`
        .replace(/[\\/:*?"<>|]/g, "")
        .slice(0, 60)

      audioPath = path.join(tmpDir, `${Date.now()}.mp3`)
      fs.writeFileSync(audioPath, audioRes.data)

      // 🖼️ Descargar portada
      if (meta.cover) {
        const coverRes = await axios.get(meta.cover, { responseType: "arraybuffer" })
        coverPath = path.join(tmpDir, `${Date.now()}_cover.jpg`)
        fs.writeFileSync(coverPath, coverRes.data)

        await client.sendMessage(
          m.chat,
          {
            image: fs.readFileSync(coverPath),
            caption: `
🎧 *${meta.title}*
👤 ${meta.artist}
⏱️ ${meta.duration}

🤖 ${BOT_NAME}
            `.trim()
          },
          { quoted: m, ...global.channelInfo }
        )
      }

      // 🔊 Enviar audio
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(audioPath),
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${safeTitle}.mp3`
        },
        { quoted: m, ...global.channelInfo }
      )

    } catch (error) {
      console.error(error)
      await client.reply(
        m.chat,
        "❌ Error al descargar el audio de Spotify.",
        m,
        global.channelInfo
      )
    } finally {
      if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath)
      if (coverPath && fs.existsSync(coverPath)) fs.unlinkSync(coverPath)
    }
  }
}
