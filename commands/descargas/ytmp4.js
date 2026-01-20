const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://nexevo-api.vercel.app/download/y2";

module.exports = {
  command: ["ytmp4"],
  categoria: "descarga",
  description: "Descarga y envía solo el video de YouTube",

  run: async (client, m, args) => {
    let filePath;

    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "❌ Ingresa un enlace o nombre del video de YouTube.",
          m,
          global.channelInfo
        );
      }

      let videoUrl = args.join(" ");
      let title = "video";

      // Si no es URL, buscar con yt-search
      if (!videoUrl.startsWith("http")) {
        const search = await yts(videoUrl);
        if (!search.videos?.length) {
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

      // Llamar a la API Nexevo
      const res = await axios.get(API_URL, {
        params: { url: videoUrl },
        timeout: 120000
      });

      const data = res.data?.result;
      if (!data?.url) throw new Error("No se obtuvo URL de descarga");

      // Crear carpeta tmp si no existe
      const tmpPath = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpPath, { recursive: true });

      // Descargar el video
      const videoRes = await axios.get(data.url, {
        responseType: "arraybuffer",
        timeout: 300000
      });

      const rawPath = path.join(tmpPath, `${Date.now()}_raw.mp4`);
      fs.writeFileSync(rawPath, videoRes.data);

      // Convertir a formato compatible WhatsApp usando FFmpeg
      filePath = path.join(tmpPath, `${Date.now()}.mp4`);
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -i "${rawPath}" -c:v libx264 -c:a aac -preset fast -movflags +faststart "${filePath}" -y`,
          (err, stdout, stderr) => {
            fs.unlinkSync(rawPath); // borrar el archivo crudo
            if (err) reject(err);
            else resolve(stdout);
          }
        );
      });

      const safeTitle = (data.info.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .slice(0, 60);

      // Enviar video
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
      console.error(err);
      await client.reply(
        m.chat,
        "❌ Error al procesar el video.",
        m,
        global.channelInfo
      );
    } finally {
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }
};