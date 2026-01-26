const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://gawrgura-api.onrender.com/download/ytdl";

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000;

// 📦 LÍMITE 150 MB
const MAX_SIZE_MB = 150;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// 🔁 Retry automático
async function axiosRetry(fn, retries = 2) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (e.response?.status === 403 && i < retries) {
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

module.exports = {
  command: ["ytdoc", "ytdl"],
  categoria: "descarga",
  description: "Descarga video de YouTube como documento",

  run: async (client, m, args) => {
    let filePath;
    const userId = m.sender;

    /* 🔒 COOLDOWN */
    if (cooldowns.has(userId)) {
      const remaining = cooldowns.get(userId) - Date.now();
      if (remaining > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(remaining / 1000)} segundos* antes de usar el comando.`,
          m,
          global.channelInfo
        );
      }
    }
    cooldowns.set(userId, Date.now() + COOLDOWN_TIME);

    try {
      /* ❌ SIN ARGUMENTOS */
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

      /* 🔎 BUSCAR SI NO ES LINK */
      if (!videoUrl.startsWith("http")) {
        const search = await yts(videoUrl);
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

      /* ⏳ MENSAJE INICIAL */
      await client.reply(
        m.chat,
        `⏳ Descargando video...\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      /* 📡 PEDIR A TU API */
      const apiRes = await axiosRetry(() =>
        axios.get(API_URL, {
          params: { url: videoUrl },
          timeout: 120000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
            Accept: "application/json",
          },
        })
      );

      const data = apiRes.data?.result;
      if (!data?.mp4) throw new Error("Respuesta inválida de la API");

      const safeTitle = (data.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .slice(0, 60);

      /* 📁 TMP */
      const tmpPath = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpPath, { recursive: true });
      filePath = path.join(tmpPath, `${Date.now()}_${userId}.mp4`);

      /* ⬇️ DESCARGAR MP4 */
      const videoRes = await axiosRetry(() =>
        axios.get(data.mp4, {
          responseType: "arraybuffer",
          timeout: 300000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36",
            Accept: "*/*",
          },
        })
      );

      const fileSize = Buffer.byteLength(videoRes.data);
      if (fileSize > MAX_SIZE_BYTES) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          `📦 El archivo pesa *${(fileSize / 1024 / 1024).toFixed(2)} MB*\n` +
            `❌ Límite máximo: *${MAX_SIZE_MB} MB*`,
          m,
          global.channelInfo
        );
      }

      fs.writeFileSync(filePath, videoRes.data);

      /* 📄 ENVIAR COMO DOCUMENTO */
      await client.sendMessage(
        m.chat,
        {
          document: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`,
          caption: `🎬 ${safeTitle}\n🤖 ${BOT_NAME}`,
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (e) {
      console.error("YTDOC API ERROR:", e);
      cooldowns.delete(userId);

      if (e.response?.status === 403) {
        return client.reply(
          m.chat,
          "⚠️ El servidor de descarga está saturado.\nIntenta nuevamente en unos segundos.",
          m,
          global.channelInfo
        );
      }

      return client.reply(
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
  },
};
