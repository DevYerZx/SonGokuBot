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
  command: ["ytaudio", "yta"],
  categoria: "descarga",

  run: async (client, m, args) => {
    let rawPath, finalPath;

    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Escribe el nombre o link del video.",
          m,
          global.channelInfo
        );
      }

      const query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      // 🔎 búsqueda
      if (!query.startsWith("http")) {
        const res = await yts(query);
        if (!res.videos.length) {
          return client.reply(m.chat, "❌ No encontrado.", m, global.channelInfo);
        }
        videoUrl = res.videos[0].url;
        title = res.videos[0].title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80);
      }

      await client.reply(
        m.chat,
        "⏳ Procesando audio…",
        m,
        global.channelInfo
      );

      rawPath = path.join(tmpDir, `${Date.now()}_raw.mp3`);
      finalPath = path.join(tmpDir, `${Date.now()}_final.mp3`);

      let downloaded = false;
      let lastError;

      // 🔁 RETRY ANTI-410 (3 intentos)
      for (let i = 1; i <= 3; i++) {
        try {
          const mp3Url = await getFreshMp3(videoUrl);

          const resAudio = await axios.get(mp3Url, {
            responseType: "stream",
            timeout: 30000,
            headers: {
              "User-Agent": "Mozilla/5.0",
              "Accept": "audio/*"
            },
            validateStatus: s => s < 500
          });

          if (resAudio.status !== 200) {
            throw new Error(`HTTP ${resAudio.status}`);
          }

          const writer = fs.createWriteStream(rawPath);
          resAudio.data.pipe(writer);

          await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
          });

          if (fs.statSync(rawPath).size < 120000) {
            throw new Error("Archivo incompleto");
          }

          downloaded = true;
          break;

        } catch (err) {
          lastError = err;
          console.log(`🔁 Reintento ${i} falló`);
          await new Promise(r => setTimeout(r, 1200));
        }
      }

      if (!downloaded) throw lastError;

      // 🛠️ FFmpeg (WhatsApp SAFE)
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${rawPath}" -vn -acodec libmp3lame -ab 128k -ar 44100 "${finalPath}"`,
          err => (err ? reject(err) : resolve())
        );
      });

      // 📤 enviar audio normal
      await client.sendMessage(
        m.chat,
        {
          audio: { url: finalPath },
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${title}.mp3`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTAUDIO:", err.message);
      await client.reply(
        m.chat,
        "❌ No se pudo descargar el audio.\nIntenta otra canción.",
        m,
        global.channelInfo
      );
    } finally {
      if (rawPath && fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
      if (finalPath && fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    }
  }
};
