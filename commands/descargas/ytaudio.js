const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

const BOT_NAME = "SonGokuBot";

async function descargarMp3(url, intentos = 2) {
  try {
    return await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 300000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "*/*",
        "Referer": "https://youtube.com"
      }
    });
  } catch (e) {
    if (e.response?.status === 410 && intentos > 0) {
      return descargarMp3(url, intentos - 1);
    }
    throw e;
  }
}

module.exports = {
  command: ["ytaudio", "yta"],
  categoria: "descarga",
  description: "Descarga audio de YouTube (rápido, sin FFmpeg)",

  run: async (client, m, args) => {
    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Ingresa el nombre del video o URL de YouTube.",
          m,
          global.channelInfo
        );
      }

      let query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

      // 🔍 Buscar si no es URL
      if (!/^https?:\/\//.test(query)) {
        const search = await yts(query);
        if (!search.videos.length) {
          return client.reply(
            m.chat,
            "❌ No se encontraron resultados.",
            m,
            global.channelInfo
          );
        }

        const v = search.videos[0];
        videoUrl = v.url;
        title = v.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80);
      }

      await client.reply(
        m.chat,
        `⏳ Descargando audio...\n🎵 ${title}\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // 🌐 API YTMP3
      const apiRes = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 120000 }
      );

      if (!apiRes.data?.status || !apiRes.data.result) {
        throw new Error("API inválida");
      }

      // ⬇️ Descargar MP3
      const audioData = await descargarMp3(apiRes.data.result);

      // 📤 Enviar directo (SIN FFmpeg)
      await client.sendMessage(
        m.chat,
        {
          audio: audioData.data,
          mimetype: "audio/mpeg",
          fileName: `${title}.mp3`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error(err);
      await client.reply(
        m.chat,
        "❌ Error al descargar el audio.",
        m,
        global.channelInfo
      );
    }
  }
};

