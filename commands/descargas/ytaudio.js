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

      // Obtener URL de descarga desde la API de Gawrgura
      const apiRes = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 180000 }
      );

      if (!apiRes.data?.status || !apiRes.data?.result)
        return client.reply(m.chat, "❌ No se pudo obtener el audio.", m);

      const audioUrl = apiRes.data.result;

      // Descargar el MP3 como buffer
      const audioBufferRes = await axios.get(audioUrl, {
        responseType: "arraybuffer",
        timeout: 180000
      });

      // Guardar temporalmente
      const tempFile = path.join(os.tmpdir(), `${Date.now()}.mp3`);
      fs.writeFileSync(tempFile, audioBufferRes.data);

      // Enviar audio
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
        "❌ Ocurrió un error al descargar o enviar el audio.",
        m,
        global.channelInfo
      );
    }
  }
};

