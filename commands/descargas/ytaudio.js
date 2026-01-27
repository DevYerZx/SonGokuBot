
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

const BOT_NAME = "SonGokuBot";

async function descargarMp3(url, filePath) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 300000,
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Accept": "*/*"
    }
  });

  fs.writeFileSync(filePath, res.data);
}

module.exports = {
  command: ["ytaudio", "yta"],
  categoria: "descarga",
  description: "Descarga audio YouTube (Baileys compatible)",

  run: async (client, m, args) => {
    let filePath;

    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Escribe el nombre del video o un enlace de YouTube.",
          m,
          global.channelInfo
        );
      }

      let query = args.join(" ");
      let videoUrl = query;
      let title = "audio_youtube";

      const tmpDir = path.join(__dirname, "../../tmp");
      fs.mkdirSync(tmpDir, { recursive: true });

      // 🔍 Buscar video si no es URL
      if (!/^https?:\/\//.test(query)) {
        const search = await yts(query);
        if (!search.videos.length) {
          return client.reply(m.chat, "❌ No encontrado.", m);
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

      // 🌐 API
      const api = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 120000 }
      );

      if (!api.data?.status || !api.data.result) {
        throw new Error("API falló");
      }

      filePath = path.join(tmpDir, `${Date.now()}.mp3`);

      // ⬇️ Descargar archivo REAL
      await descargarMp3(api.data.result, filePath);

      // 📏 Verificar tamaño
      const size = fs.statSync(filePath).size;
      if (size < 50_000) throw new Error("MP3 corrupto");

      // 📤 ENVIAR COMO BUFFER (CLAVE)
      await client.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(filePath), // ✅ BUFFER
          mimetype: "audio/mpeg",
          ptt: false
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (e) {
      console.error(e);
      await client.reply(
        m.chat,
        "❌ Error al enviar el audio.",
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
