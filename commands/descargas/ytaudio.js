const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");
const { exec } = require("child_process");

module.exports = {
  command: ["ytaudio", "yta"],
  categoria: "descarga",
  description: "Descarga audio de YouTube (compatible WhatsApp)",

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

      // 📂 tmp
      const tmpDir = path.join(__dirname, "../../tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      // 🔎 buscar si no es URL
      if (!query.startsWith("http")) {
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
        `⏳ Descargando audio...\n🎵 ${title}`,
        m,
        global.channelInfo
      );

      // 🌐 API YTMP3
      const api = await axios.get(
        `https://gawrgura-api.onrender.com/download/ytmp3?url=${encodeURIComponent(videoUrl)}`,
        { timeout: 120000 }
      );

      if (!api.data?.status || !api.data.result) {
        throw new Error("API inválida");
      }

      rawPath = path.join(tmpDir, `${Date.now()}_raw.mp3`);
      finalPath = path.join(tmpDir, `${Date.now()}_final.mp3`);

      // ⬇️ descargar audio
      const audioStream = await axios.get(api.data.result, {
        responseType: "stream",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "*/*"
        },
        timeout: 300000
      });

      const writer = fs.createWriteStream(rawPath);
      audioStream.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // 🛠️ FFmpeg → WhatsApp safe
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -i "${rawPath}" -vn -acodec libmp3lame -ab 128k -ar 44100 "${finalPath}"`,
          err => (err ? reject(err) : resolve())
        );
      });

      // 🧪 validar tamaño
      const size = fs.statSync(finalPath).size;
      if (size < 100000) throw new Error("Audio corrupto");

      // 📤 ENVIAR AUDIO NORMAL
      await client.sendMessage(
        m.chat,
        {
          audio: { url: finalPath }, // 👈 PATH, NO BUFFER
          mimetype: "audio/mpeg",
          ptt: false,
          fileName: `${title}.mp3`
        },
        { quoted: m, ...global.channelInfo }
      );

    } catch (err) {
      console.error(err);
      await client.reply(
        m.chat,
        "❌ Ocurrió un error al procesar el audio.",
        m,
        global.channelInfo
      );
    } finally {
      // 🗑️ limpiar
      if (rawPath && fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
      if (finalPath && fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    }
  }
};
