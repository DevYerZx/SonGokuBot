const fs = require("fs")
const path = require("path")
const axios = require("axios")
const yts = require("yt-search")
const { exec } = require("child_process")

// 🔗 API AUDIO
const API_URL = "https://nexevo-api.vercel.app/download/y"

// ⏳ COOLDOWN
const cooldowns = new Map()
const COOLDOWN_TIME = 15 * 1000
const sleep = ms => new Promise(r => setTimeout(r, ms))

module.exports = {
  command: ["yt1"],
  categoria: "descarga",
  description: "Busca y descarga audio de YouTube (MP3)",

  run: async (client, m, args) => {
    const userId = m.sender
    let rawMp3, finalMp3

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
          "❌ Escribe el nombre o link del audio",
          m,
          global.channelInfo
        )
      }

      const query = args.join(" ")
      let videoUrl, title = "audio"

      // 📁 TMP
      const tmpDir = path.join(__dirname, "../../tmp")
      fs.mkdirSync(tmpDir, { recursive: true })

      rawMp3 = path.join(tmpDir, `${Date.now()}_raw.mp3`)
      finalMp3 = path.join(tmpDir, `${Date.now()}_final.mp3`)

      // 🔍 BUSCAR SI NO ES LINK
      if (!/^https?:\/\//.test(query)) {
        const search = await yts(query)
        if (!search.videos.length) {
          cooldowns.delete(userId)
          return client.reply(
            m.chat,
            "❌ No se encontró el audio",
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
`🎧 *AUDIO*
🎵 ${title}
⏳ Descargando…`,
        m,
        global.channelInfo
      )

      // 📥 OBTENER MP3
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

          const writer = fs.createWriteStream(rawMp3)
          res.data.pipe(writer)

          await new Promise((r, e) => {
            writer.on("finish", r)
            writer.on("error", e)
          })

          if (fs.statSync(rawMp3).size < 100000)
            throw new Error("Archivo incompleto")

          ok = true
          break
        } catch {
          await sleep(1200)
        }
      }

      if (!ok) throw new Error("Fallo descarga")

      // 🎼 NORMALIZAR MP3 (COMPATIBILIDAD WHATSAPP)
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loglevel error -i "${rawMp3}" -vn -acodec libmp3lame -ab 128k "${finalMp3}"`,
          err => (err ? reject(err) : resolve())
        )
      })

      // 📤 ENVIAR AUDIO
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(finalMp3),
          mimetype: "audio/mpeg"
        },
        { quoted: m, ...global.channelInfo }
      )

    } catch (err) {
      console.error("PLAY1 ERROR:", err.message)
      cooldowns.delete(userId)

      await client.reply(
        m.chat,
        "❌ Error al procesar el audio",
        m,
        global.channelInfo
      )

    } finally {
      // 🧹 LIMPIEZA TOTAL
      if (rawMp3 && fs.existsSync(rawMp3)) fs.unlinkSync(rawMp3)
      if (finalMp3 && fs.existsSync(finalMp3)) fs.unlinkSync(finalMp3)
    }
  }
}
