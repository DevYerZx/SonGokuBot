const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://gawrgura-api.onrender.com/download/ytdl";

// ⏳ COOLDOWN
const cooldowns = new Map();
const COOLDOWN_TIME = 15 * 1000;

// 📦 LÍMITE (150 MB)
const MAX_SIZE_MB = 150;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

module.exports = {
  command: ["ytdl", "ytdoc"],
  categoria: "descarga",
  description: "Descarga videos de YouTube y los envía como documento",

  run: async (client, m, args) => {
    const userId = m.sender;
    let filePath;

    /* ========= COOLDOWN ========= */
    if (cooldowns.has(userId)) {
      const restante = cooldowns.get(userId) - Date.now();
      if (restante > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(restante / 1000)} segundos* para volver a usar este comando.`,
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

      /* ========= BUSCAR SI NO ES LINK ========= */
      if (!query.startsWith("http")) {
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
        "⏳ Obteniendo enlace de descarga...",
        m,
        global.channelInfo
      );

      /* ========= LLAMAR A TU API ========= */
      const apiRes = await axios.get(API_URL, {
        params: { url: videoUrl },
        timeout: 120000
      });

      const data = apiRes.data?.result;
      if (!data?.mp4) throw new Error("API sin enlace mp4");

      const safeTitle = (data.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .slice(0, 60);

      /* ========= VERIFICAR TAMAÑO (HEAD) ========= */
      const head = await axios.head(data.mp4, { timeout: 60000 });
      const fileSize = parseInt(head.headers["content-length"] || 0);

      if (fileSize > MAX_SIZE_BYTES) {
        cooldowns.delete(userId);
        return client.reply(
          m.chat,
          `📦 El archivo pesa *${(fileSize / 1024 / 1024).toFixed(2)} MB*\n` +
          `❌ Límite permitido: *${MAX_SIZE_MB} MB*`,
          m,
          global.channelInfo
        );
      }

      /* ========= RUTA TEMP ========= */
      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      filePath = path.join(tmpDir, `${Date.now()}_${userId}.mp4`);

      await client.reply(
        m.chat,
        "⬇️ Descargando video...\n📤 Preparando envío...",
        m,
        global.channelInfo
      );

      /* ========= DESCARGA POR STREAM ========= */
      const response = await axios.get(data.mp4, {
        responseType: "stream",
        timeout: 300000
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      /* ========= ENVIAR COMO DOCUMENTO ========= */
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
      console.error("❌ YTDL ERROR:", err);
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
