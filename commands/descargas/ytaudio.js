const axios = require("axios");

const BOT_NAME = "SonGoku";

module.exports = {
  command: ["ytaudio", "mp3"],
  categoria: "descarga",
  description: "Descarga audio de YouTube en MP3 usando la API Gawrgura",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Usa: .ytaudio <link o nombre de la canción>\nEjemplo:\n.ytaudio https://www.youtube.com/watch?v=NVLgkXylEuQ",
          m,
          global.channelInfo
        );
      }

      const query = args.join(" ");

      // ⏳ Mensaje de búsqueda
      await client.reply(
        m.chat,
        `🔎 Buscando y descargando audio...\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // Ver si es URL o texto
      let videoUrl = query;
      if (!query.startsWith("http")) {
        // Buscar con la API de Gawrgura
        const searchRes = await axios.get(
          `https://gawrgura-api.onrender.com/search/ytmp3?q=${encodeURIComponent(query)}`,
          { timeout: 60000 }
        );
        const results = searchRes.data?.result;
        if (!results || !results.length) {
          return client.reply(m.chat, "❌ No se encontró la canción.", m);
        }
        videoUrl = results[0].url;
      }

      // Descargar el audio
      const downloadRes = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 120000 } // 2 minutos
      );

      if (!downloadRes.data?.status || !downloadRes.data?.result) {
        return client.reply(
          m.chat,
          "❌ Error al descargar el audio.",
          m,
          global.channelInfo
        );
      }

      const audioUrl = downloadRes.data.result;
      const title = downloadRes.data.title || "YouTube Audio";

      // ✅ Enviar audio a WhatsApp
      await client.sendMessage(
        m.chat,
        {
          audio: { url: audioUrl },
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`,
          caption: `🎵 ${title}\n🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTMP3 ERROR:", err.response?.data || err.message);
      await client.reply(
        m.chat,
        "❌ Ocurrió un error al descargar el audio.",
        m,
        global.channelInfo
      );
    }
  }
};

