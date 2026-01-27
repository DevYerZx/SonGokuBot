const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

module.exports = {
  command: ["ytaudio", "yta"],
  categoria: "descarga",

  run: async (client, m, args) => {
    let audioPath;

    try {
      if (!args.length) {
        return client.reply(m.chat, "⚠️ Escribe el nombre o link del video.", m);
      }

      const query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

      // 📂 carpeta temporal
      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      // 🔎 Buscar si no es URL
      if (!query.startsWith("http")) {
        const res = await yts(query);
        if (!res.videos.length) {
          return client.reply(m.chat, "❌ No encontrado.", m);
        }
        videoUrl = res.videos[0].url;
        title = res.videos[0].title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80);
      }

      await client.reply(m.chat, "⏳ Descargando audio…", m);

      // 🌐 API MP3
      const api = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 120000 }
      );

      if (!api.data?.status || !api.data.result) {
        throw new Error("API inválida");
      }

      audioPath = path.join(tmpDir, `${Date.now()}.mp3`);

      // ⬇️ Descargar MP3
      const audioRes = await axios.get(api.data.result, {
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        }
      });

      const writer = fs.createWriteStream(audioPath);
      audioRes.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // 🧪 Validar tamaño (WhatsApp odia audios vacíos)
      const size = fs.statSync(audioPath).size;
      if (size < 100000) throw new Error("MP3 corrupto");

      // 📤 ENVIAR AUDIO NORMAL (CLAVE)
      await client.sendMessage(
        m.chat,
        {
          audio: { url: audioPath }, // ⚠️ PATH, NO BUFFER
          mimetype: "audio/mpeg",
          ptt: false
        },
        { quoted: m }
      );

    } catch (err) {
      console.error(err);
      await client.reply(
        m.chat,
        "❌ Error al enviar el audio.",
        m
      );
    } finally {
      if (audioPath && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    }
  }
};
  
