module.exports = {
  command: ["ytdlmp4"],
  run: async (client, m, args) => {
    try {
      const url = args[0]
      if (!url) return

      m.reply("⬇️ Descargando video...")

      const api = `https://gawrgura-api.onrender.com/download/ytdl?url=${encodeURIComponent(url)}`
      const res = await axios.get(api)

      if (!res.data.status || !res.data.result.mp4) {
        return m.reply("❌ Video no disponible")
      }

      await client.sendMessage(
        m.chat,
        {
          video: { url: res.data.result.mp4 },
          mimetype: "video/mp4",
          caption: `🎬 ${res.data.result.title}`
        },
        { quoted: m }
      )

    } catch (e) {
      console.error(e)
      m.reply("❌ Error al descargar video")
    }
  }
}