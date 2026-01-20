const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://nexevo-api.vercel.app/download/y2";

module.exports = {
  command: ["ytmp4", "videoyt"],
  categoria: "descarga",
  description: "Descarga videos de YouTube con miniatura y envía el video",

  run: async (client, m, args) => {
    let videoPath, thumbPath;

    try {
      if (!args.length)
        return m.reply(
          "❌ Ingresa un enlace o el nombre del video de YouTube.",
          m,
          global.channelInfo
        );

      let query = args.join(" ");
      let title = "video";

      // Si no es URL, buscar con yt-search
      if (!query.startsWith("http")) {
        const search = await yts(query);
        if (!search.videos.length)
          return m.reply("❌ No se encontraron resultados.", m, global.channelInfo);

        query = search.videos[0].url;
        title = search.videos[0].title || title;
      }

      await client.reply(
        m.chat,
        `🎬 Preparando tu video...\n⏳ ${BOT_NAME} está trabajando`,
        m,
        global.channelInfo
      );

      // Llamar a la API Nexevo
      const res = await axios.get(API_URL, { params: { url: query }, timeout: 120000 });
      const data = res.data?.result;

      if (!data?.url) throw new Error("No se obtuvo URL de descarga");

      const safeTitle = (data.info?.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .slice(0, 60);

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      // Descargar miniatura si existe
      if (data.info?.thumbnail) {
        const thumbRes = await axios.get(data.info.thumbnail, { responseType: "arraybuffer" });
        thumbPath = path.join(tmpDir, `${Date.now()}_thumb.jpg`);
        fs.writeFileSync(thumbPath, thumbRes.data);

        // Enviar miniatura primero
        await client.sendMessage(
          m.chat,
          {
            image: fs.readFileSync(thumbPath),
            caption: `🎬 *${safeTitle}*\n🤖 ${BOT_NAME}`,
          },
          { quoted: m, ...global.channelInfo }
        );
      }

      // Descargar video
      const videoRes = await axios.get(data.url, { responseType: "arraybuffer", timeout: 300000 });
      const rawPath = path.join(tmpDir, `${Date.now()}_raw.mp4`);
      fs.writeFileSync(rawPath, videoRes.data);

      // Convertir a formato compatible WhatsApp
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

      // Enviar video reproducible
      await client.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(videoPath),
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`,
          caption: `🎬 *${safeTitle}*\n🤖 ${BOT_NAME}\n📌 Disfruta tu video`,
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
      if (videoPath && fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      if (thumbPath && fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }
  }
};