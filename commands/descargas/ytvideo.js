const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://gawrgura-api.onrender.com/download/ytdl";

module.exports = {
  command: ["ytvideo", "videoyt", "ytdl"],
  categoria: "descarga",
  description: "Descarga y envía solo el video de YouTube",

  run: async (client, m, args) => {
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
        `⏳ Buscando tu video...\nPuede tardar si el archivo es pesado.\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // Llamada a la API YTDL
      const res = await axios.get(API_URL, {
        params: { url: videoUrl },
        timeout: 120000
      });

      const data = res.data?.result;
      if (!data?.mp4) throw new Error("Respuesta inválida de la API");

      // Nombre seguro del archivo
      const safeTitle = (data.title || title)
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .slice(0, 60);

      const videoRes = await axios.get(data.mp4, { responseType: "arraybuffer", timeout: 300000 });
      const tmpPath = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath);

      const filePath = path.join(tmpPath, `${Date.now()}.mp4`);
      fs.writeFileSync(filePath, videoRes.data);

      // Enviar el video
      const buffer = fs.readFileSync(filePath);
      await client.sendMessage(
        m.chat,
        {
          video: buffer,
          mimetype: "video/mp4",
          fileName: `${safeTitle}.mp4`,
          caption: `🎬 ${safeTitle}\n🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      );

      fs.unlinkSync(filePath);

    } catch (err) {
      console.error("YTDL VIDEO ERROR:", err.response?.data || err.message);
      await client.reply(
        m.chat,
        "❌ Error al descargar o enviar el video.",
        m,
        global.channelInfo
      );
    }
  }
};

