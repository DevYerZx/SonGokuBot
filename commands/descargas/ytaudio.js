const axios = require("axios");
const yts = require("yt-search");

const BOT_NAME = "SonGokuBOT";

module.exports = {
  command: ["ytaudio", "mp3"],
  categoria: "descarga",
  description: "Descarga audio de YouTube en MP3 por nombre",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Usa: .ytaudio <nombre de la canción>\nEjemplo:\n.ytaudio Despacito",
          m,
          global.channelInfo
        );
      }

      const query = args.join(" ");

      // Buscar por nombre con yt-search
      const search = await yts(query);
      if (!search.videos || !search.videos.length) {
        return client.reply(m.chat, "❌ No se encontraron resultados.", m);
      }

      const video = search.videos[0];
      const videoUrl = video.url;
      const videoTitle = video.title;
      const videoThumbnail = video.thumbnail;
      const videoAuthor = video.author?.name || "YouTube";
      const videoDuration = video.timestamp || "--:--";

      // ⏳ Mensaje de descarga
      await client.reply(
        m.chat,
        `⏳ Descargando audio de:\n🎵 *${videoTitle}*\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // Descargar el audio usando API Gawrgura
      const downloadRes = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 120000 }
      );

      if (!downloadRes.data?.status || !downloadRes.data?.result) {
        return client.reply(m.chat, "❌ Error al descargar el audio.", m);
      }

      const audioUrl = downloadRes.data.result;

      // ✅ Enviar audio
      const caption = `
🎵 *${videoTitle}*
👤 *${videoAuthor}*
⏱ *${videoDuration}*
🔗 ${videoUrl}
🤖 ${BOT_NAME}
      `;

      await client.sendMessage(
        m.chat,
        {
          audio: { url: audioUrl },
          mimetype: "audio/mpeg",
          fileName: `${videoTitle}.mp3`,
          caption
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTAUDIO ERROR:", err.response?.data || err.message);
      await client.reply(
        m.chat,
        "❌ Ocurrió un error al descargar el audio.",
        m,
        global.channelInfo
      );
    }
  }
};


