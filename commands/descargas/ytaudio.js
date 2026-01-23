const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://api-adonix.ultraplus.click/download/ytaudio";
const API_KEY = "dvyer"; // 🔑 TU API KEY

module.exports = {
  command: ["ytaudio"],
  categoria: "descarga",
  description: "Descarga audio de YouTube en MP3",

  run: async (client, m, args) => {
    let filePath;

    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Ingresa el nombre o enlace del video de YouTube.",
          m,
          global.channelInfo
        );
      }

      let query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

      // 🔎 Buscar si no es link
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
        title = v.title;
      }

      await client.reply(
        m.chat,
        `⏳ Descargando audio...\n🎵 ${title}\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // 📡 API con KEY
      const res = await axios.get(API_URL, {
        params: {
          url: videoUrl,
          apikey: API_KEY
        },
        timeout: 120000
      });

      if (!res.data?.status || !res.data?.data?.url) {
        throw new Error("API inválida");
      }

      const audioUrl = res.data.data.url;
      const safeTitle = res.data.data.title
        .replace(/[\\/:*?"<>|]/g, "")
        .slice(0, 60);

      // 📁 TMP
      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      filePath = path.join(tmpDir, `${Date.now()}.mp3`);

      const audio = await axios.get(audioUrl, {
        responseType: "arraybuffer",
        timeout: 300000
      });

      fs.writeFileSync(filePath, audio.data);

      // 🎧 ENVIAR
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(filePath),
          mimetype: "audio/mpeg",
          fileName: `${safeTitle}.mp3`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTAUDIO ERROR:", err);
      client.reply(
        m.chat,
        "❌ Error al descargar el audio.",
        m,
        global.channelInfo
      );
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
};

