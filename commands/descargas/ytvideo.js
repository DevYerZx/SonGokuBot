const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://gawrgura-api.onrender.com/download/ytdl";

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000; // 15 segundos

module.exports = {
  command: ["ytvideo"],
  categoria: "descarga",
  description: "Descarga y envía solo el video de YouTube",

  run: async (client, m, args) => {
    let filePath;
    const userId = m.sender;

    // 🔒 Verificar cooldown
    if (cooldowns.has(userId)) {
      const expire = cooldowns.get(userId);
      const remaining = expire - Date.now();

      if (remaining > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(remaining / 1000)} segundos* antes de volver a usar este comando.`,
          m,
          global.channelInfo
        );
      }
    }

    // ✅ Activar cooldown
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

      let videoUrl = args.join(" ");
      let title = "video";

      if (!videoUrl.startsWith("http")) {
        const search = await yts(videoUrl);
        if (!search.videos?.length) {
          cooldowns.delete(userId);
          return client.reply(
            m.chat,
            "❌ No se encontraron resultados.",
            m,
            global.channelInfo
          );
        }
        videoUrl = search.videos[0].url;
        title = search.videos[0].title || title;
      }

      await client.reply(
        m.chat,
        `⏳ Buscando tu video...\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      const res = await axios.get(API_URL, {
        params: { url: videoUrl },
        timeout: 120000
      });

      const data = res.data?.result;
      if (!data?.mp4) throw new Error("Respuesta inválida");

      const safeTitle = (data.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .slice(0, 60);

      const tmpPath = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpPath, { recursive: true });

      const videoRes = await axios.get(data.mp4, {
        responseType: "arraybuffer",
        timeout: 300000
      });

      filePath = path.join(tmpPath, `${Date.now()}_${userId}.mp4`);
      fs.writeFileSync(filePath, videoRes.data);

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
      cooldowns.delete(userId);
      await client.reply(
        m.chat,
        "❌ Error al descargar o enviar el video.",
        m,
        global.channelInfo
      );
    } finally {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
};
