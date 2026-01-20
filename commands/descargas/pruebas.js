const axios = require("axios");
const fs = require("fs");
const path = require("path");

const BOT_NAME = "SonGokuBot";
const API_URL = "https://nexevo-api.vercel.app/download/y2";

module.exports = {
  command: ["ytnexevo", "ytvideo", "ytmp4"],
  categoria: "descarga",
  description: "Descarga video de YouTube y lo envía correctamente",

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

      const data = apiRes.data?.result;
      if (!data?.url) throw new Error("Respuesta inválida");

      const title = data.info?.title || "YouTube Video";
      const safeTitle = title.replace(/[\\/:*?"<>|]/g, "").slice(0, 60);

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      filePath = path.join(tmpDir, `${Date.now()}.mp4`);

      const videoStream = await axios({
        method: "GET",
        url: data.url,
        responseType: "stream",
        timeout: 300000
      });

      const writer = fs.createWriteStream(filePath);
      videoStream.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      await client.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(filePath),
          mimetype: "video/mp4",
          caption: `🎬 ${safeTitle}\n📺 ${data.quality}p\n🤖 ${BOT_NAME}`
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