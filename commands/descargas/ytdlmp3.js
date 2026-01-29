module.exports = {
  command: ["ytdlmp3"],
  run: async (client, m, args) => {
    try {
      const url = args[0]
      if (!url) return

      m.reply("⬇️ Descargando audio...")

      const api = `https://gawrgura-api.onrender.com/download/ytdl?url=${encodeURIComponent(url)}`
      const res = await axios.get(api)

      if (!res.data.status || !res.data.result.mp3) {
        return m.reply("❌ Audio no disponible")
      }

      await client.sendMessage(
        m.chat,
        {
          audio: { url: res.data.result.mp3 },
          mimetype: "audio/mpeg",
          caption: `🎵 ${res.data.result.title}`
        },
        { quoted: m }
      )

    } catch (e) {
      console.error(e)
      m.reply("❌ Error al descargar audio")
    }
  }
}