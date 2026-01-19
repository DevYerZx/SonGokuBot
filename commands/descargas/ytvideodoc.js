const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://gawrgura-api.onrender.com/download/ytdl";

module.exports = {
  command: ["ytdoc", "ytdl"],
  categoria: "descarga",
  description: "Descarga y envía el video de YouTube como documento",

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

      // 🔎 Buscar si no es link
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

      filePath = path.join(tmpPath, `${Date.now()}.mp4`);
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