const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

const BOT_NAME = "SonGokuBot";

// ⬇️ Descargar MP3 como STREAM (igual que navegador)
async function descargarMp3Stream(url, filePath) {
  const response = await axios({
    method: "GET",
    url,
    responseType: "stream",
    timeout: 300000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Accept": "*/*",
      "Referer": "https://youtube.com"
    }
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

module.exports = {
  command: ["ytaudio", "yta"],
  categoria: "descarga",
  description: "Descarga audio de YouTube (100% reproducible)",

  run: async (client, m, args) => {
    let filePath;

    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Escribe el nombre del video o pega un enlace de YouTube.",
          m,
          global.channelInfo
        );
      }

      let query = args.join(" ");
      let videoUrl = query;
      let title = "audio_youtube";

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      // 🔍 Buscar si no es URL
      if (!/^https?:\/\//.test(query)) {
        const search = await yts(query);
        if (!search.videos.length) {
          return client.reply(
            m.chat,
            "❌ No se encontraron resultados.",
            m,
            global.channelInfo
          );
        }

        const v = search.videos[0];
        videoUrl = v.url;
        title = v.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80);
      }

      await client.reply(
        m.chat,
        `⏳ Descargando audio...\n🎵 ${title}\n🤖 ${BOT_NAME}`,
        m,
        global.channelInfo
      );

      // 🌐 API YTMP3
      const apiRes = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 120000 }
      );

      if (!apiRes.data?.status || !apiRes.data.result) {
        throw new Error("API inválida");
      }

      filePath = path.join(tmpDir, `${Date.now()}.mp3`);

      // ⬇️ Descargar correctamente
      await descargarMp3Stream(apiRes.data.result, filePath);

      // 📏 Validar tamaño mínimo
      const stats = fs.statSync(filePath);
      if (stats.size < 50_000) {
        throw new Error("Archivo MP3 incompleto");
      }

      // ⏱️ Asegurar cierre del archivo
      await new Promise(r => setTimeout(r, 500));

      // 📤 ENVIAR AUDIO (FORMA CORRECTA)
      await client.sendMessage(
        m.chat,
        {
          audio: fs.createReadStream(filePath), // 👈 CLAVE FINAL
          mimetype: "audio/mpeg",
          ptt: false
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error(err);
      await client.reply(
        m.chat,
        "❌ Error al descargar o enviar el audio.",
        m,
        global.channelInfo
      );
    } finally {
      // 🧹 Limpiar archivo
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
};
