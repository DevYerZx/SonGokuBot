const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const { exec } = require("child_process");

async function getFreshMp3(videoUrl) {
  const { data } = await axios.get(
    `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
    { timeout: 20000 }
  );

  if (!data?.status || !data.result) {
    throw new Error("API inválida");
  }

  return data.result;
}

module.exports = {
  command: ["ytaudio", "yta"],
  categoria: "descarga",

  run: async (client, m, args) => {
    let rawPath, finalPath;

    try {
      if (!args.length) {
        return client.reply(m.chat, "⚠️ Escribe el nombre o link del video.", m, global.channelInfo);
      }

      let query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      // 🔎 Buscar si no es URL
      if (!query.startsWith("http")) {
        const res = await yts(query);
        if (!res.videos.length) {
          return client.reply(m.chat, "❌ No encontrado.", m, global.channelInfo);
        }
        const v = res.videos[0];
        videoUrl = v.url;
        title = v.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80);
      }

      await client.reply(m.chat, "⏳ Descargando audio…", m, global.channelInfo);

      rawPath = path.join(tmpDir, `${Date.now()}_raw.mp3`);
      finalPath = path.join(tmpDir, `${Date.now()}_final.mp3`);

      // 🔁 Retry inteligente
      let ok = false;
      for (let i = 1; i <= 3; i++) {
        try {
          const mp3Url = await getFreshMp3(videoUrl);

          const res = await axios.get(mp3Url, {
            responseType: "stream",
            timeout: 35000,
            headers: { "User-Agent": "Mozilla/5.0" }
          });

          await new Promise((resolve, reject) => {
            const w = fs.createWriteStream(rawPath);
            res.data.pipe(w);
            w.on("finish", resolve);
            w.on("error", reject);
          });

          if (fs.statSync(rawPath).size < 150000) {
            throw new Error("MP3 incompleto");
          }

          ok = true;
          break;
        } catch {
          await new Promise(r => setTimeout(r, 1200));
        }
      }

      if (!ok) throw new Error("No se pudo descargar");

      // 🛠️ FFmpeg (opcional pero recomendado)
      try {
        await new Promise((resolve, reject) => {
          exec(
            `ffmpeg -y -i "${rawPath}" -vn -ar 44100 -ac 2 -b:a 128k "${finalPath}"`,
            err => (err ? reject(err) : resolve())
          );
        });
      } catch {
        // fallback si FFmpeg falla
        finalPath = rawPath;
      }

      if (!fs.existsSync(finalPath) || fs.statSync(finalPath).size < 150000) {
        throw new Error("Audio final inválido");
      }

      // ⏳ asegurar cierre de archivo
      await new Promise(r => setTimeout(r, 500));

      // 📤 ENVÍO CORRECTO (STREAM)
      await client.sendMessage(
        m.chat,
        {
          audio: fs.createReadStream(finalPath),
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${title}.mp3`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (e) {
      console.error("YTAUDIO:", e.message);
      client.reply(m.chat, "❌ Error al procesar el audio.", m, global.channelInfo);
    } finally {
      [rawPath, finalPath].forEach(f => {
        if (f && fs.existsSync(f)) fs.unlinkSync(f);
      });
    }
  }
};
