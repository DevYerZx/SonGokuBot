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
          `⏳ *Espera ${Math.ceil(remaining / 1000)}s* antes de volver a usar el comando.`,
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
          "❌ *Ingresa un enlace o nombre del video de YouTube.*",
          m,
          global.channelInfo
        );
      }

      let videoUrl = args.join(" ");
      let title = "video";

      // 🔍 Buscar si no es URL
      if (!videoUrl.startsWith("http")) {
        const search = await yts(videoUrl);
        if (!search.videos?.length) {
          cooldowns.delete(userId);
          return client.reply(
            m.chat,
            "❌ *No se encontraron resultados.*",
            m,
            global.channelInfo
          );
        }
        videoUrl = search.videos[0].url;
        title = search.videos[0].title || title;
      }

      await client.reply(
        m.chat,
        `╭━━━〔 🎬 𝐘𝐓 𝐕𝐈𝐃𝐄𝐎 〕━━━╮
┃ ⏳ Descargando video…
┃ 🤖 ${BOT_NAME}
╰━━━━━━━━━━━━━━━━━━━━╯`,
        m,
        global.channelInfo
      );

      // 🌐 API
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

      // 📁 ENVIAR COMO DOCUMENTO
      await client.sendMessage(
        m.chat,
        {
          document: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`,
          caption:
`╭━━━〔 📁 𝐕𝐈𝐃𝐄𝐎 𝐘𝐓 〕━━━╮
┃ 🎬 *Título:* ${safeTitle}
┃ 📦 *Formato:* MP4
┃ 🤖 *Bot:* ${BOT_NAME}
╰━━━━━━━━━━━━━━━━━━━━╯`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      cooldowns.delete(userId);
      await client.reply(
        m.chat,
        "❌ *Error al descargar o enviar el video.*",
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