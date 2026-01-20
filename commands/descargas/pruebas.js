const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://nexevo-api.vercel.app/download/y2";

module.exports = {
  command: ["ytnexevo", "ytmp4"],
  categoria: "descarga",
  description: "Descarga video de YouTube (documento)",

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

      const ytUrl = args[0];

      await client.reply(
        m.chat,
        "⏳ Descargando video...\n🤖 SonGokuBot",
        m,
        global.channelInfo
      );

      const apiRes = await axios.get(API_URL, {
        params: { url: ytUrl },
        timeout: 120000
      });

      const result = apiRes.data?.result;
      if (!result?.url) throw new Error("URL inválida");

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      filePath = path.join(tmpDir, `${Date.now()}.mp4`);

      const videoRes = await axios.get(result.url, {
        responseType: "arraybuffer",
        timeout: 300000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      fs.writeFileSync(filePath, Buffer.from(videoRes.data));

      await client.sendMessage(
        m.chat,
        {
          document: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          fileName: "YouTube-Video.mp4",
          caption: `🎬 Video YouTube\n📺 ${result.quality}p\n🤖 ${BOT_NAME}`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (e) {
      await client.reply(
        m.chat,
        "❌ Error al descargar el video.",
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