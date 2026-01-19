const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const os = require("os");

const BOT_NAME = "SonGokuBOT";

module.exports = {
  command: ["ytaudio", "mp3"],
  categoria: "descarga",
  description: "Descarga audio de YouTube en MP3 por nombre o URL",

  run: async (client, m, args) => {
    try {
      if (!args.length)
        return client.reply(
          m.chat,
          "⚠️ Usa: .ytaudio <nombre o URL de YouTube>\nEjemplo: .ytaudio Despacito",
          m,
          global.channelInfo
        );

      let videoUrl = args[0];
      let videoTitle = "";

      // Si es URL de YouTube
      if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(videoUrl)) {
        videoTitle = videoUrl;
      } else {
        // Buscar por nombre con yt-search
        const search = await yts(args.join(" "));
        if (!search.videos || !search.videos.length)
          return client.reply(m.chat, "❌ No se encontraron resultados.", m);

        const video = search.videos[0];
        videoUrl = video.url;
        videoTitle = video.title;
      }

      await client.reply(
        m.chat,
        `⏳ Descargando audio de:\n🎵 *${videoTitle}*\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // Descargar desde la API de Gawrgura
      const downloadRes = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { responseType: "arraybuffer", timeout: 180000 }
      );

      if (!downloadRes.data?.result)
        return client.reply(m.chat, "❌ Error al obtener el audio.", m);

      // Guardar temporalmente
      const tempFile = path.join(os.tmpdir(), `${Date.now()}.mp3`);
      const audioBuffer = await axios.get(downloadRes.data.result, {
        responseType: "arraybuffer",
        timeout: 180000
      });
      fs.writeFileSync(tempFile, audioBuffer.data);

      // Enviar el audio
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(tempFile),
          mimetype: "audio/mpeg",
          fileName: `${videoTitle}.mp3`,
          caption: `🎵 *${videoTitle}*\n🔗 ${videoUrl}\n🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      );

      // Borrar temporal
      fs.unlinkSync(tempFile);

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


