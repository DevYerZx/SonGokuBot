const axios = require("axios");
const yts = require("yt-search");

const BOT_NAME = "SonGokuBot";

module.exports = {
  command: ["ytaudio", "mp3"],
  categoria: "descarga",
  description: "Descarga audio de YouTube en MP3 por nombre o URL",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Usa: .ytaudio <link o nombre de la canción>\nEjemplo:\n.ytaudio https://www.youtube.com/watch?v=NVLgkXylEuQ\n.o\n.ytaudio Despacito",
          m,
          global.channelInfo
        );
      }

      const query = args.join(" ");
      let videoUrl, videoTitle, videoThumbnail, videoAuthor, videoDuration;

      // Ver si es URL o texto
      if (query.startsWith("http")) {
        videoUrl = query;
        videoTitle = "YouTube Audio";
        videoThumbnail = "";
        videoAuthor = "";
        videoDuration = "";
      } else {
        // Buscar por nombre con yt-search
        const search = await yts(query);
        if (!search.videos || !search.videos.length) {
          return client.reply(m.chat, "❌ No se encontraron resultados.", m);
        }

        const video = search.videos[0];
        videoUrl = video.url;
        videoTitle = video.title;
        videoThumbnail = video.thumbnail;
        videoAuthor = video.author?.name || "YouTube";
        videoDuration = video.timestamp || "--:--";
      }

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

      // ✅ Enviar audio con diseño bonito y botones
      const caption = `
🎬 *${videoTitle}*
👤 *${videoAuthor}*
⏱ *${videoDuration}*
🔗 ${videoUrl}
🤖 ${BOT_NAME}
      `;

      const buttons = [
        {
          buttonId: `.ytaudio ${videoUrl}`,
          buttonText: { displayText: "🎵 Audio" },
          type: 1
        },
        {
          buttonId: `.ytvideo ${videoUrl}`,
          buttonText: { displayText: "🎬 Video" },
          type: 1
        },
        {
          buttonId: `.play_siguiente`,
          buttonText: { displayText: "➡️ Siguiente" },
          type: 1
        }
      ];

      await client.sendMessage(
        m.chat,
        {
          image: { url: videoThumbnail || "https://i.ibb.co/Xrxbcymh/IMG-20241011-WA0000.jpg" },
          caption,
          buttons,
          footer: "🐉 SonGokuBOT • Ultra Instinto • DVYER 🐉",
          headerType: 4,
          audio: { url: audioUrl },
          mimetype: "audio/mpeg",
          fileName: `${videoTitle}.mp3`
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

