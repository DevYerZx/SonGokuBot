const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://nexevo-api.vercel.app/download/y2";

module.exports = {
  command: ["ytx"],
  categoria: "descarga",
  description: "Descarga videos de YouTube y los envía como documento",

  run: async (client, m, args) => {
    let videoPath;

    try {
      if (!args.length)
        return m.reply(
          "❌ Ingresa un enlace o el nombre del video de YouTube.",
          m,
          global.channelInfo
        );

      let query = args.join(" ");
      let title = "video";

      // 🔎 Buscar si no es URL
      if (!query.startsWith("http")) {
        const search = await yts(query);
        if (!search.videos.length)
          return m.reply("❌ No se encontraron resultados.", m, global.channelInfo);

        query = search.videos[0].url;
        title = search.videos[0].title || title;
      }

      // 🔔 Notificación
      await client.reply(
        m.chat,
        `📥 Descargando video...\n⏳ ${BOT_NAME} está trabajando`,
        m,
        global.channelInfo
      );

      // 🌐 API Nexevo
      const res = await axios.get(API_URL, {
        params: { url: query },
        timeout: 120000
      });

      const data = res.data?.result;
      if (!data?.url) throw new Error("No se obtuvo URL de descarga");

      const safeTitle = (data.info?.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .slice(0, 60);

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      // ⬇️ Descargar video crudo
      const videoRes = await axios.get(data.url, {
        responseType: "arraybuffer",
        timeout: 300000
      });

      const rawPath = path.join(tmpDir, `${Date.now()}_raw.mp4`);
      fs.writeFileSync(rawPath, videoRes.data);

      // 🎞️ Convertir (WhatsApp friendly)
      videoPath = path.join(tmpDir, `${Date.now()}.mp4`);
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -i "${rawPath}" -c:v libx264 -c:a aac -preset fast -movflags +faststart "${videoPath}" -y`,
          (err) => {
            fs.unlinkSync(rawPath);
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // 📤 ENVIAR COMO DOCUMENTO
      await client.sendMessage(
        m.chat,
        {
          document: fs.readFileSync(videoPath),
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`,
          caption: `📁 *YOUTUBE MP4*\n🎬 ${safeTitle}\n🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error(err);
      await client.reply(
        m.chat,
        "❌ Ocurrió un error al procesar el video.",
        m,
        global.channelInfo
      );
    } finally {
      // 🧹 Limpieza
      if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    }
  }
};


