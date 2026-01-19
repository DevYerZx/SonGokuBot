const axios = require("axios")
const yts = require("yt-search")
const fs = require("fs")

const BOT_NAME = "SonGokuBot"
const ADONIX_API = "https://api-adonix.ultraplus.click/download/ytaudio"
const APIKEY = "dvyer"

// 🧠 Control de usuarios en proceso
const audioEnProceso = new Set()

module.exports = {
  command: ["ytaudio"],
  categoria: "descarga",
  descripcion: "Descarga audio de YouTube",

  run: async (client, m, args) => {
    const userId = m.sender

    try {
      // 🚫 Bloquear múltiples solicitudes
      if (audioEnProceso.has(userId)) {
        return client.reply(
          m.chat,
          "⏳ Espera a que termine tu audio actual antes de pedir otro.",
          m
        )
      }

      if (!args.length) {
        return client.reply(
          m.chat,
          "❌ Usa: .ytaudio <nombre o link de YouTube>",
          m
        )
      }

      audioEnProceso.add(userId)

      let videoUrl = args.join(" ")
      let title = "audio"

      // 🔎 Buscar si no es link
      if (!videoUrl.startsWith("http")) {
        const search = await yts(videoUrl)
        if (!search.videos.length) {
          audioEnProceso.delete(userId)
          return client.reply(
            m.chat,
            "❌ No se encontraron resultados.",
            m
          )
        }
        videoUrl = search.videos[0].url
        title = search.videos[0].title
      }

      await client.reply(
        m.chat,
        `⏳ Descargando audio...\n🤖 ${BOT_NAME}`,
        m
      )

      // 📡 Llamada a la API
      const res = await axios.get(ADONIX_API, {
        params: {
          apikey: APIKEY,
          url: videoUrl
        },
        timeout: 60000
      })

      const data = res.data
      let result = data.result || data.data || data

      if (data.status && data.data) result = data.data
      if (data.status && data.result) result = data.result

      if (!result?.url) throw "Audio no generado"

      const safeTitle = (result.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .slice(0, 60)

      await client.reply(
        m.chat,
        "🔊 Descargando archivo de audio...",
        m
      )

      // ⬇️ Descargar MP3
      const audio = await axios.get(result.url, {
        responseType: "arraybuffer",
        timeout: 60000
      })

      const filePath = `./${userId}.mp3`
      fs.writeFileSync(filePath, audio.data)

      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(filePath),
          mimetype: "audio/mpeg",
          fileName: `${safeTitle}.mp3`
        },
        { quoted: m }
      )

      fs.unlinkSync(filePath)
      audioEnProceso.delete(userId)

    } catch (e) {
      console.error("YTAUDIO:", e)
      audioEnProceso.delete(userId)

      client.reply(
        m.chat,
        "❌ La API tardó demasiado o falló.\nIntenta nuevamente.",
        m
      )
    }
  }
}
