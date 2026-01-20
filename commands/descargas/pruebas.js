const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://nexevo-api.vercel.app/download/y2";

module.exports = {
  command: ["ytnexevo","ytmp4"],
  categoria: "descarga",
  description: "Descarga video de YouTube y lo envía como video",

  run: async (client, m, args) => {
    let filePath;

    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "❌ Ingresa un enlace de YouTube.",
          m,
          global.channelInfo
        );
      }

      const videoUrl = args[0];

      await client.reply(
        m.chat,
        `⏳ Descargando video...\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      const res = await axios.get(API_URL, {
        params: { url: videoUrl },
        timeout: 120000
      });

      const data = res.data?.result;
      if (!data?.url) throw new Error("Respuesta inválida");

      const title = data.info?.title || "Video YouTube";
      const safeTitle = title
        .replace(/[\\/:*?"<>|]/g, "")
        .trim()
        .slice(0, 60);

      const tmpPath = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpPath, { recursive: true });

      const videoRes = await axios.get(data.url, {
        responseType: "arraybuffer",
        timeout: 300000
      });

      filePath = path.join(tmpPath, `${Date.now()}.mp4`);
      fs.writeFileSync(filePath, videoRes.data);

      await client.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          caption: `🎬 ${safeTitle}\n📺 Calidad: ${data.quality}p\n🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (e) {
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