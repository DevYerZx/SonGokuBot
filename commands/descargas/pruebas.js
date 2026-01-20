const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://nexevo-api.vercel.app/download/y2";

module.exports = {
  command: ["ytmp4", "ytvideo", "ytnexevo"],
  categoria: "descarga",
  description: "Descarga video de YouTube",

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

      const apiRes = await axios.get(API_URL, {
        params: { url: videoUrl },
        timeout: 120000
      });

      const result = apiRes.data?.result;
      if (!result?.url) throw new Error("Respuesta inválida");

      const title = result.info?.title || "YouTube Video";
      const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").slice(0, 60);

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      filePath = path.join(tmpDir, `${Date.now()}.mp4`);

      const videoRes = await axios.get(result.url, {
        responseType: "arraybuffer",
        timeout: 300000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      fs.writeFileSync(filePath, Buffer.from(videoRes.data));

      await client.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          caption: `🎬 ${safeTitle}\n📺 ${result.quality}p\n🤖 ${BOT_NAME}`
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