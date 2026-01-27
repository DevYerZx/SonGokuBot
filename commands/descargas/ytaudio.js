const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const { exec } = require("child_process");

module.exports = {
  command: ["ytaudio", "yta"],
  categoria: "descarga",
  description: "Audio YouTube compatible WhatsApp",

  run: async (client, m, args) => {
    let rawFile, finalFile;

    try {
      if (!args.length) {
        return client.reply(
          m.chat,
          "⚠️ Debes enviar un enlace o nombre.",
          m,
          global.channelInfo
        );
      }

      let query = args.join(" ");
      let videoUrl = query;
      let title = "audio";

      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      // 🔎 Si no es URL (por si alguien escribe)
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

      // 🌐 API
      const api = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 15000 }
      );

      if (!api.data?.status || !api.data.result) {
        throw new Error("API inválida");
      }

      rawFile = path.join(tmpDir, `${Date.now()}_raw.mp3`);
      finalFile = path.join(tmpDir, `${Date.now()}_final.mp3`);

      // ⬇️ Descargar MP3 (con headers correctos)
      const resAudio = await axios.get(api.data.result, {
        responseType: "stream",
        timeout: 30000,
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "audio/*"
        }
      });

      // ❌ Si no es audio real
      const type = resAudio.headers["content-type"] || "";
      if (!type.includes("audio")) {
        throw new Error("No es audio");
      }

      const writer = fs.createWriteStream(rawFile);
      resAudio.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // ❌ Tamaño inválido
      if (fs.statSync(rawFile).size < 120000) {
        throw new Error("Archivo incompleto");
      }

      // 🛠️ FFmpeg (WhatsApp SAFE)
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${rawFile}" -vn -acodec libmp3lame -ab 128k -ar 44100 "${finalFile}"`,
          err => (err ? reject(err) : resolve())
        );
      });

      // 📤 ENVIAR AUDIO NORMAL
      await client.sendMessage(
        m.chat,
        {
          audio: { url: finalFile },
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${title}.mp3`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error("YTAUDIO ERROR:", err.message);
      await client.reply(
        m.chat,
        "❌ No se pudo procesar el audio.\nIntenta otra canción.",
        m,
        global.channelInfo
      );
    } finally {
      if (rawFile && fs.existsSync(rawFile)) fs.unlinkSync(rawFile);
      if (finalFile && fs.existsSync(finalFile)) fs.unlinkSync(finalFile);
    }
  }
};
