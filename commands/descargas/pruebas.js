const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const API_URL = "https://nexevo-api.vercel.app/download/y2";

module.exports = {
  command: ["ytnexevo", "ytmp4"],
  categoria: "descarga",
  description: "Descarga video de YouTube",

  run: async (client, m, args) => {
    let rawPath, fixedPath;

    try {
      if (!args[0]) {
        return m.reply("❌ Ingresa un enlace de YouTube");
      }

      await m.reply("⏳ Descargando video...");

      const apiRes = await axios.get(API_URL, {
        params: { url: args[0] },
        timeout: 120000
      });

      const result = apiRes.data?.result;
      if (!result?.url) throw "Respuesta inválida";

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      rawPath = path.join(tmpDir, "raw.mp4");
      fixedPath = path.join(tmpDir, "fixed.mp4");

      const videoRes = await axios.get(result.url, {
        responseType: "arraybuffer",
        timeout: 300000,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      fs.writeFileSync(rawPath, Buffer.from(videoRes.data));

      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${rawPath}" -movflags faststart -c copy "${fixedPath}"`,
          (err) => (err ? reject(err) : resolve())
        );
      });

      await client.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(fixedPath),
          mimetype: "video/mp4",
          caption: `🎬 YouTube Video\n📺 ${result.quality}p\n🤖 SonGokuBot`
        },
        { quoted: m }
      );

    } catch (e) {
      await m.reply("❌ Error al procesar el video");
    } finally {
      [rawPath, fixedPath].forEach(f => {
        if (f && fs.existsSync(f)) fs.unlinkSync(f);
      });
    }
  }
};