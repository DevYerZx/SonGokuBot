const fs = require("fs")
const path = require("path")
const axios = require("axios")
const yts = require("yt-search")
const { exec } = require("child_process")

// 🔗 API
const API_URL = "https://nexevo-api.vercel.app/download/y2"

// ⏳ COOLDOWN
const cooldowns = new Map()
const COOLDOWN_TIME = 15 * 1000
const sleep = ms => new Promise(r => setTimeout(r, ms))

module.exports = {
  command: ["yt2"],
  categoria: "descarga",
  description: "Busca y descarga videos de YouTube (MP4)",

  run: async (client, m, args) => {
    const userId = m.sender
    let rawMp4, finalMp4

    // 🔒 Cooldown
    if (cooldowns.has(userId)) {
      const wait = cooldowns.get(userId) - Date.now()
      if (wait > 0)
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(wait / 1000)}s*`,
          m,
          global.channelInfo
        )
    }
    cooldowns.set(userId, Date.now() + COOLDOWN_TIME)

    try {
      if (!args.length) {
        cooldowns.delete(userId)
        return client.reply(
          m.chat,
          "❌ Escribe el nombre o link del video",
          m,
          global.channelInfo
        )
      }

      const query = args.join(" ")
      let videoUrl, title = "video"

      // 📁 TMP
      const tmpDir = path.join(__dirname, "../../tmp")
      fs.mkdirSync(tmpDir, { recursive: true })

      rawMp4 = path.join(tmpDir, `${Date.now()}_raw.mp4`)
      finalMp4 = path.join(tmpDir, `${Date.now()}_final.mp4`)

      // 🔍 BUSCAR SI NO ES LINK
      if (!/^https?:\/\//.test(query)) {
        const search = await yts(query)
        if (!search.videos.length) {
          cooldowns.delete(userId)
          return client.reply(
            m.chat,
            "❌ No se encontró el video",
            m,
            global.channelInfo
          )
        }

        videoUrl = search.videos[0].url
        title = search.videos[0].title
          .replace(/[\\/:*?"<>|]/g, "")
          .slice(0, 60)
      } else {
        videoUrl = query
      }

      // 🔔 AVISO
      await client.reply(
        m.chat,
`🎬 *VIDEO*
📹 ${title}
⏳ Descargando…`,
        m,
        global.channelInfo
      )

      // 📥 OBTENER MP4
      const api = `${API_URL}?url=${encodeURIComponent(videoUrl)}`
      const { data } = await axios.get(api, { timeout: 20000 })

      if (!data.status || !data.result?.url)
        throw new Error("API inválida")

      // 🔁 DESCARGA CON REINTENTOS
      let ok = false
      for (let i = 0; i < 3; i++) {
        try {
          const res = await axios.get(data.result.url, {
            responseType: "stream",
            timeout: 60000,
            headers: { "User-Agent": "Mozilla/5.0" }
          })

          const writer = fs.createWriteStream(rawMp4)
          res.data.pipe(writer)

          await new Promise((r, e) => {
            writer.on("finish", r)
            writer.on("error", e)
          })

          if (fs.statSync(rawMp4).size < 300000)
            throw new Error("Archivo incompleto")

          ok = true
          break
        } catch {
          await sleep(1200)
        }
      }

      if (!ok) throw new Error("Fallo descarga")

      // 🎞️ NORMALIZAR (OBLIGATORIO PARA WHATSAPP)
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loglevel error -i "${rawMp4}" -map 0:v -map 0:a? -movflags +faststart -c:v copy -c:a copy "${finalMp4}"`,
          err => (err ? reject(err) : resolve())
        )
      })

      // 📤 ENVIAR VIDEO
      await client.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(finalMp4),
          mimetype: "video/mp4"
        },
        { quoted: m, ...global.channelInfo }
      )

    } catch (err) {
      console.error("YT2 ERROR:", err.message)
      cooldowns.delete(userId)

      await client.reply(
        m.chat,
        "❌ Error al procesar el video",
        m,
        global.channelInfo
      )

    } finally {
      // 🧹 LIMPIEZA TOTAL (NO QUEDA NADA EN CONSOLA / SERVIDOR)
      if (rawMp4 && fs.existsSync(rawMp4)) fs.unlinkSync(rawMp4)
      if (finalMp4 && fs.existsSync(finalMp4)) fs.unlinkSync(finalMp4)
    }
  }
}

