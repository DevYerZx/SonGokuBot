const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://gawrgura-api.onrender.com/download/ytdl";

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000; // 15 segundos

// 📦 LÍMITE DE PESO (150 MB)
const MAX_SIZE_MB = 400;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

module.exports = {
  command: ["ytdoc", "ytdl"],
  categoria: "descarga",
  description: "Descarga y envía el video de YouTube como documento",

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

      // 🔎 Buscar si no es link
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
        `⏳ Descargando video...\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // 📡 Obtener link MP4
      const res = await axios.get(API_URL, {
        params: { url: videoUrl },
        timeout: 120000
      });

      const data = res.data?.result;
      if (!data?.mp4) throw new Error("Respuesta inválida de la API");

      const safeTitle = (data.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .slice(0, 60);

      // 📁 Carpeta temporal
      const tmpPath = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpPath, { recursive: true });

      // ⬇️ Descargar video
      const videoRes = await axios.get(data.mp4, {
        responseType: "arraybuffer",
        timeout: 300000
      });

      // 📦 Verificar tamaño
      const fileSize = Buffer.byteLength(videoRes.data);
      if (fileSize > MAX_SIZE_BYTES) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          `📦 El archivo pesa *${(fileSize / 1024 / 1024).toFixed(2)} MB*\n\n` +
          `❌ El límite es *${MAX_SIZE_MB} MB*\n` +
          `📩 Para aumentar el límite, habla con el *owner*.`,
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
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
};
