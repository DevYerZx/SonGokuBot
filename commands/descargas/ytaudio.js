const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const { exec } = require("child_process");

async function getFreshMp3(videoUrl) {
  const api = await axios.get(
    `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
    { timeout: 15000 }
  );
  if (!api.data?.status || !api.data.result) {
    throw new Error("API inválida");
  }
  return api.data.result;
}

module.exports = {
  command: ["ytaudio"],
  categoria: "descarga",

  run: async (client, m, args) => {
    let rawPath, finalPath;

    try {
      if (!args.length) {
        return client.reply(m.chat, "⚠️ Escribe el nombre o link.", m);
      }

      const query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      // 🔎 buscar
      if (!query.startsWith("http")) {
        const res = await yts(query);
        if (!res.videos.length) {
          return client.reply(m.chat, "❌ No encontrado.", m);
        }
        videoUrl = res.videos[0].url;
        title = res.videos[0].title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80);
      }

      await client.reply(m.chat, "⏳ Descargando audio…", m);

      rawPath = path.join(tmpDir, `${Date.now()}_raw.mp3`);
      finalPath = path.join(tmpDir, `${Date.now()}_final.mp3`);

      // ⬇️ descargar (1 intento rápido)
      const mp3Url = await getFreshMp3(videoUrl);
      const resAudio = await axios.get(mp3Url, {
        responseType: "arraybuffer", // 🚀 MÁS RÁPIDO
        timeout: 30000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      fs.writeFileSync(rawPath, resAudio.data);

      let audioBuffer;

      // 🧪 probar si WhatsApp lo acepta SIN ffmpeg
      try {
        audioBuffer = fs.readFileSync(rawPath);
        if (audioBuffer.length < 150000) throw "muy pequeño";
      } catch {
        // 🛠️ fallback FFmpeg SOLO si falla
        await new Promise((resolve, reject) => {
          exec(
            `ffmpeg -y -i "${rawPath}" -vn -acodec libmp3lame -ab 96k -ar 44100 "${finalPath}"`,
            err => (err ? reject(err) : resolve())
          );
        });
        audioBuffer = fs.readFileSync(finalPath);
      }

      // 📤 enviar (BUFFER = más rápido)
      await client.sendMessage(
        m.chat,
        {
          audio: audioBuffer,
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${title}.mp3`
        },
        { quoted: m }
      );

    } catch (err) {
      console.error("YTAUDIO:", err.message);
      await client.reply(
        m.chat,
        "❌ Error al procesar el audio.",
        m
      );
    } finally {
      if (rawPath && fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
      if (finalPath && fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    }
  }
};
