const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://api-adonix.ultraplus.click/download/ytvideo";
const API_KEY = "dvyer";

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000;

// 📦 LÍMITE 300 MB
const MAX_SIZE_MB = 500;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

module.exports = {
  command: ["ytdoc"],
  categoria: "descarga",
  description: "Descarga video de YouTube y lo envía como documento",

  run: async (client, m, args) => {
    let filePath;
    const userId = m.sender;

    // 🔒 Cooldown
    if (cooldowns.has(userId)) {
      const remaining = cooldowns.get(userId) - Date.now();
      if (remaining > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(remaining / 1000)} segundos* antes de usar este comando.`,
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
        `⏳ Descargando video...\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // 📡 API ytvideo
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

      const videoRes = await axios.get(data.url, {
        responseType: "arraybuffer",
        timeout: 300000
      });

      const fileSize = Buffer.byteLength(videoRes.data);
      if (fileSize > MAX_SIZE_BYTES) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          `📦 Peso: *${(fileSize / 1024 / 1024).toFixed(2)} MB*\n` +
          `❌ Límite: *${MAX_SIZE_MB} MB*\n` +
          `📩 Contacta al *owner* para aumentar el límite.`,
          m,
          global.channelInfo
        );
      }

      filePath = path.join(tmpPath, `${Date.now()}_${userId}.mp4`);
      fs.writeFileSync(filePath, videoRes.data);

      // 📄 ENVIAR COMO DOCUMENTO
      await client.sendMessage(
        m.chat,
        {
          document: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`,
          caption: `🎬 ${safeTitle}\n🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTDOC ERROR:", err);
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

