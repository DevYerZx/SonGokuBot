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

module.exports = {
  command: ["ytdoc"],
  categoria: "descarga",
  description: "Descarga un video de YouTube y lo envía como documento",

  run: async (client, m, args) => {
    const userId = m.sender;
    let filePath;

    /* ================= COOLDOWN ================= */
    if (cooldowns.has(userId)) {
      const wait = cooldowns.get(userId) - Date.now();
      if (wait > 0) {
        return client.reply(
          m.chat,
          `⏳ Espera *${Math.ceil(wait / 1000)}s* antes de usar este comando.`,
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

      /* 🔎 BUSCAR SI NO ES LINK */
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
        "📥 Descargando video...\n⏳ SonGokuBot está trabajando",
        m,
        global.channelInfo
      );

      /* 🌐 LLAMAR API (CON KEY) */
      const apiRes = await axios.get(API_URL, {
        params: {
          url: videoUrl,
          apikey: API_KEY
        },
        timeout: 120000
      });

      const data = apiRes.data?.data;
      if (!apiRes.data?.status || !data?.url) {
        throw new Error("API sin enlace de descarga");
      }

      const safeTitle = (data.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .slice(0, 60);

      /* 📂 TMP */
      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      filePath = path.join(tmpDir, `${Date.now()}_${userId}.mp4`);

      /* ⬇️ DESCARGA LOCAL (STREAM) */
      const response = await axios.get(data.url, {
        responseType: "stream",
        timeout: 0
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      /* 📤 ENVIAR COMO DOCUMENTO */
      await client.sendMessage(
        m.chat,
        {
          document: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`,
          caption: `📁 *YOUTUBE MP4*\n🎬 ${safeTitle}\n🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTDOC ERROR:", err);
      cooldowns.delete(userId);

      await client.reply(
        m.chat,
        "❌ Error al descargar o enviar el video.\n📦 Puede ser muy pesado para WhatsApp.",
        m,
        global.channelInfo
      );
    } finally {
      /* 🧹 LIMPIAR TMP */
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
};

