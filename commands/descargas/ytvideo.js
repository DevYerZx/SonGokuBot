const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://api-adonix.ultraplus.click/download/ytvideo";
const API_KEY = "dvyer";

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000; // 15 segundos

module.exports = {
  command: ["ytvideo", "videoyt", "ytdl"],
  categoria: "descarga",
  description: "Descarga videos de YouTube en MP4",

  run: async (client, m, args) => {
    let filePath;
    const userId = m.sender;

    // 🔒 Cooldown
    if (cooldowns.has(userId)) {
      const remaining = cooldowns.get(userId) - Date.now();
      if (remaining > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(remaining / 1000)} segundos* antes de volver a usar este comando.`,
          m,
          global.channelInfo
        );
      }
    }
    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      if (!args.length) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          "❌ Ingresa un enlace o nombre del video de YouTube.",
          m,
          global.channelInfo
        );
      }

      let query = args.join(" ");
      let videoUrl = query;
      let title = "video";

      // 🔎 Buscar si no es link
      if (!/^https?:\/\//.test(query)) {
        const search = await yts(query);
        if (!search.videos.length) {
          cooldowns.delete(userId);
          return client.reply(
            m.chat,
            "❌ No se encontraron resultados.",
            m,
            global.channelInfo
          );
        }
        videoUrl = search.videos[0].url;
        title = search.videos[0].title;
      }

      await client.reply(
        m.chat,
        `⏳ Descargando video...\n🎬 ${title}\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // 📡 API NUEVA + KEY
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

      const data = res.data.data;
      const safeTitle = data.title
        .replace(/[\\/:*?"<>|]/g, "")
        .slice(0, 60);

      // 📁 TMP
      const tmpPath = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpPath, { recursive: true });

      filePath = path.join(tmpPath, `${Date.now()}_${userId}.mp4`);

      const videoRes = await axios.get(data.url, {
        responseType: "arraybuffer",
        timeout: 300000
      });

      fs.writeFileSync(filePath, videoRes.data);

      // 🎬 ENVIAR VIDEO
      await client.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`,
          caption: `🎬 ${safeTitle}\n🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTVIDEO ERROR:", err);
      cooldowns.delete(userId);
      await client.reply(
        m.chat,
        "❌ Error al descargar o enviar el video.",
        m,
        global.channelInfo
      );
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
};

