const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const yts = require("yt-search");

const API_URL = "https://nexevo-api.vercel.app/download/y2";

module.exports = {
  command: ["ytnexevo", "ytmp4"],
  categoria: "descarga",
  description: "Descarga video de YouTube por link o búsqueda",

  run: async (client, m, args) => {
    let rawPath, fixedPath;

    try {
      if (!args.length) {
        return m.reply("❌ Ingresa un link o el nombre del video");
      }

      await m.reply("⏳ Buscando video...");

      let videoUrl;

      // 🔍 SI NO ES LINK → BUSCAR
      if (!args[0].includes("youtube.com") && !args[0].includes("youtu.be")) {
        const search = await yts(args.join(" "));
        if (!search.videos.length) {
          return m.reply("❌ No se encontraron resultados");
        }
        videoUrl = search.videos[0].url;
      } else {
        videoUrl = args[0];
      }

      await m.reply("⬇️ Descargando video...");

      const apiRes = await axios.get(API_URL, {
        params: { url: videoUrl },
        timeout: 120000
      });

      const result = apiRes.data?.result;
      if (!result?.url) throw "Respuesta inválida";

      const info = result.info || {};
      const channel = info.channel || "Desconocido";
      const quality = result.quality || "N/A";

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

      // 🔧 FIX WhatsApp (no formato inusual)
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${rawPath}" -movflags faststart -c copy "${fixedPath}"`,
          (err) => (err ? reject(err) : resolve())
        );
      });

      const caption =
`🎬 *YouTube Video*
📡 Canal: ${channel}
📺 Calidad: ${quality}p
🤖 SonGokuBot`;

      await client.sendMessage(
        m.chat,
        {
          video: fs.readFileSync(fixedPath),
          mimetype: "video/mp4",
          caption
        },
        { quoted: m }
      );

    } catch (e) {
      console.error(e);
      await m.reply("❌ Error al procesar el video");
    } finally {
      [rawPath, fixedPath].forEach(f => {
        if (f && fs.existsSync(f)) fs.unlinkSync(f);
      });
    }
  }
};